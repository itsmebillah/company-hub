package io.github.itsmebillah.companyhub.employee.tracking

import android.os.Handler
import android.os.HandlerThread
import java.util.UUID

internal class LocationBatchPipeline(
    private val sessionId: String,
    private val apiBaseUrl: String,
    accessToken: String,
    private val queue: EncryptedLocationQueue,
    private val client: LocationIngestionClient = LocationIngestionClient(),
    private val onHealthChanged: (pendingCount: Int, syncState: String) -> Unit,
    private val onPermanentRejection: (reason: String) -> Unit,
    private val onReconciliationRequired: (reason: String) -> Unit,
) {
    private val thread = HandlerThread("company-hub-location-sync")
    private lateinit var handler: Handler
    private var stopped = false
    private var automaticAttemptCount = 0
    @Volatile
    private var currentAccessToken = accessToken

    fun start() {
        thread.start()
        handler = Handler(thread.looper)
        publishHealth("idle")
        scheduleFlush(TrackingCadence.IDLE_FLUSH_INTERVAL_MS)
    }

    fun enqueue(event: LocationObservationSource.Event.Observation): Boolean {
        if (stopped || !isValid(event)) return false
        return try {
            val accepted = queue.enqueue(
                QueuedLocationPoint(
                    trackingSessionId = sessionId,
                    idempotencyKey = "loc:$sessionId:${UUID.randomUUID()}",
                    observedAtEpochMillis = event.observedAtEpochMillis,
                    latitude = event.latitude,
                    longitude = event.longitude,
                    accuracyMeters = event.accuracyMeters,
                ),
            )
            if (accepted) {
                publishHealth("pending")
                scheduleFlush(TrackingCadence.IMMEDIATE_FLUSH_DELAY_MS)
            } else {
                publishHealth("queue_full")
            }
            accepted
        } catch (_: Exception) {
            publishHealth("queue_error")
            false
        }
    }

    fun retryNow() {
        if (!stopped) {
            automaticAttemptCount = 0
            scheduleFlush(0)
        }
    }

    fun onNetworkAvailable() {
        if (!stopped) scheduleFlush(0)
    }

    fun updateAccessToken(accessToken: String) {
        currentAccessToken = accessToken
        retryNow()
    }

    fun stop(invalidate: Boolean) {
        stopped = true
        if (::handler.isInitialized) handler.removeCallbacksAndMessages(null)
        if (invalidate) {
            queue.clearSession(sessionId)
            publishHealth("discarded")
        } else {
            publishHealth("suspended")
        }
        if (thread.isAlive) thread.quitSafely()
    }

    private fun scheduleFlush(delayMillis: Long) {
        if (!stopped && ::handler.isInitialized) {
            handler.removeCallbacks(flushRunnable)
            handler.postDelayed(flushRunnable, delayMillis)
        }
    }

    private val flushRunnable = Runnable {
        if (stopped) return@Runnable
        val batch = queue.peek(sessionId, EncryptedLocationQueue.MAX_BATCH_POINTS)
        if (batch.isEmpty()) {
            automaticAttemptCount = 0
            publishHealth("idle")
            scheduleFlush(TrackingCadence.IDLE_FLUSH_INTERVAL_MS)
            return@Runnable
        }
        publishHealth("syncing")
        when (val result = client.submit(apiBaseUrl, currentAccessToken, batch)) {
            LocationIngestionClient.Result.Success -> {
                queue.removeKeys(sessionId, batch.mapTo(mutableSetOf()) { it.idempotencyKey })
                automaticAttemptCount = 0
                publishHealth(if (queue.count(sessionId) == 0) "idle" else "pending")
                scheduleFlush(TrackingCadence.delayAfterSuccessfulUpload(queue.count(sessionId)))
            }
            is LocationIngestionClient.Result.Retryable -> {
                automaticAttemptCount += 1
                if (automaticAttemptCount >= MAX_AUTOMATIC_RETRIES) {
                    publishHealth("retry_exhausted")
                    onReconciliationRequired("location_sync_retry_exhausted")
                } else {
                    publishHealth("retry_scheduled")
                    scheduleFlush(result.retryAfterMillis)
                }
            }
            LocationIngestionClient.Result.AuthenticationRequired -> {
                publishHealth("authentication_required")
                onReconciliationRequired("location_authentication_required")
            }
            is LocationIngestionClient.Result.Rejected -> {
                stopped = true
                queue.clearSession(sessionId)
                publishHealth("rejected")
                onPermanentRejection(result.reason)
                thread.quitSafely()
            }
        }
    }

    private fun publishHealth(syncState: String) {
        onHealthChanged(queue.count(sessionId), syncState)
    }

    private fun isValid(event: LocationObservationSource.Event.Observation): Boolean {
        val now = System.currentTimeMillis()
        return event.latitude.isFinite() && event.latitude in -90.0..90.0 &&
            event.longitude.isFinite() && event.longitude in -180.0..180.0 &&
            event.accuracyMeters.isFinite() && event.accuracyMeters in 0f..10_000f &&
            event.observedAtEpochMillis > 0 && event.observedAtEpochMillis <= now + 5 * 60_000L
    }

    companion object {
        private const val MAX_AUTOMATIC_RETRIES = 8
    }
}
