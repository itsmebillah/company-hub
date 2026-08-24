package io.github.itsmebillah.companyhub.employee.tracking

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import io.github.itsmebillah.companyhub.employee.MainActivity

class DutyTrackingService : Service() {
    private lateinit var observationSource: LocationObservationSource
    private lateinit var queue: EncryptedLocationQueue
    private var pipeline: LocationBatchPipeline? = null
    private var preserveQueueOnDestroy = false
    private lateinit var connectivityManager: ConnectivityManager
    private val networkCallback = object : ConnectivityManager.NetworkCallback() {
        override fun onAvailable(network: Network) {
            val capabilities = connectivityManager.getNetworkCapabilities(network)
            if (capabilities?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) == true) {
                pipeline?.onNetworkAvailable()
            }
        }
    }
    private val eligibilityHandler = Handler(Looper.getMainLooper())
    private val eligibilityCheck = object : Runnable {
        override fun run() {
            if (!hasRequiredPermissions()) {
                suspendAndStop("tracking_prerequisite_missing")
                return
            }
            if (!observationSource.isObserving()) {
                suspendAndStop("location_observation_inactive")
                return
            }
            eligibilityHandler.postDelayed(this, ELIGIBILITY_CHECK_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        activeInstance = this
        observationSource = LocationManagerObservationSource(this)
        queue = EncryptedLocationQueue(this)
        connectivityManager = getSystemService(ConnectivityManager::class.java)
        connectivityManager.registerDefaultNetworkCallback(networkCallback)
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val serverAuthorized =
            intent?.getBooleanExtra(EXTRA_SERVER_AUTHORIZED, false) == true
        val sessionId = intent?.getStringExtra(EXTRA_SESSION_ID)?.trim().orEmpty()
        val apiBaseUrl = intent?.getStringExtra(EXTRA_API_BASE_URL)?.trim().orEmpty()
        val accessToken = intent?.getStringExtra(EXTRA_ACCESS_TOKEN)?.trim().orEmpty()
        if (
            !serverAuthorized || sessionId.isEmpty() || apiBaseUrl.isEmpty() ||
            accessToken.isEmpty() || !hasRequiredPermissions()
        ) {
            TrackingRuntime.update("suspended", "tracking_prerequisite_missing")
            stopSelf()
            return START_NOT_STICKY
        }
        if (TrackingRuntime.state == "active" && TrackingRuntime.sessionId == sessionId) {
            pipeline?.updateAccessToken(accessToken)
            return START_NOT_STICKY
        }
        queue.retainSession(sessionId)
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            ?: Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notificationBuilder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        val notification = notificationBuilder
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle("Duty tracking is active")
            .setContentText(
                "Company Hub displays this while your authorized duty session is active.",
            )
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_SERVICE)
            .build()
        startForeground(NOTIFICATION_ID, notification)
        pipeline = LocationBatchPipeline(
            sessionId = sessionId,
            apiBaseUrl = apiBaseUrl,
            accessToken = accessToken,
            queue = queue,
            onHealthChanged = TrackingRuntime::syncHealth,
            onPermanentRejection = ::suspendAndStop,
            onReconciliationRequired = ::suspendForReconciliation,
        ).also { it.start() }
        when (val result = observationSource.start(::handleObservationEvent)) {
            is LocationObservationSource.StartResult.Started -> {
                TrackingRuntime.observationStarted(result.provider)
                TrackingRuntime.update("active", null, sessionId)
                eligibilityHandler.removeCallbacks(eligibilityCheck)
                eligibilityHandler.postDelayed(
                    eligibilityCheck,
                    ELIGIBILITY_CHECK_INTERVAL_MS,
                )
            }
            is LocationObservationSource.StartResult.Unavailable -> {
                suspendAndStop(result.reason)
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        eligibilityHandler.removeCallbacksAndMessages(null)
        if (::observationSource.isInitialized) observationSource.stop()
        pipeline?.stop(invalidate = !preserveQueueOnDestroy)
        pipeline = null
        if (::connectivityManager.isInitialized) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback)
            } catch (_: IllegalArgumentException) {
                // The callback may already be unregistered during a fast teardown.
            }
        }
        TrackingRuntime.observationStopped()
        if (activeInstance === this) activeInstance = null
        if (TrackingRuntime.state == "active" || TrackingRuntime.state == "stopping") {
            TrackingRuntime.update("stopped", "service_stopped")
        }
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun handleObservationEvent(event: LocationObservationSource.Event) {
        when (event) {
            is LocationObservationSource.Event.Observation -> {
                if (TrackingRuntime.state != "active" || TrackingRuntime.sessionId == null) {
                    return
                }
                if (pipeline?.enqueue(event) == true) {
                    TrackingRuntime.observationReceived()
                } else {
                    suspendForReconciliation("location_queue_capacity_reached")
                }
            }
            is LocationObservationSource.Event.Suspended -> suspendAndStop(event.reason)
        }
    }

    private fun suspendAndStop(reason: String) {
        eligibilityHandler.removeCallbacksAndMessages(null)
        if (::observationSource.isInitialized) observationSource.stop()
        pipeline?.stop(invalidate = true)
        pipeline = null
        TrackingRuntime.observationStopped()
        TrackingRuntime.update("suspended", reason)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun suspendForReconciliation(reason: String) {
        preserveQueueOnDestroy = true
        eligibilityHandler.removeCallbacksAndMessages(null)
        if (::observationSource.isInitialized) observationSource.stop()
        pipeline?.stop(invalidate = false)
        pipeline = null
        TrackingRuntime.observationStopped()
        TrackingRuntime.update("suspended", reason)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Duty tracking",
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = "Persistent disclosure while duty tracking is active."
            setShowBadge(false)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun hasRequiredPermissions(): Boolean {
        val locationGranted =
            checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED &&
                checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
        val notificationGranted =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
        return locationGranted && notificationGranted
    }

    companion object {
        @Volatile
        private var activeInstance: DutyTrackingService? = null

        fun retryPending() {
            activeInstance?.pipeline?.retryNow()
        }

        const val ACTION_START = "io.github.itsmebillah.companyhub.employee.tracking.START"
        const val EXTRA_SESSION_ID = "trackingSessionId"
        const val EXTRA_SERVER_AUTHORIZED = "serverAuthorized"
        const val EXTRA_API_BASE_URL = "apiBaseUrl"
        const val EXTRA_ACCESS_TOKEN = "accessToken"
        private const val CHANNEL_ID = "company_hub_duty_tracking"
        private const val NOTIFICATION_ID = 51045
        private const val ELIGIBILITY_CHECK_INTERVAL_MS = 2_000L
    }
}
