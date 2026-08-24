package io.github.itsmebillah.companyhub.employee.tracking

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class CurrentPositionProvider(context: Context) {
    private val applicationContext = context.applicationContext
    private val locationManager = applicationContext.getSystemService(LocationManager::class.java)
    private val handler = Handler(Looper.getMainLooper())
    private var listener: LocationListener? = null
    private var timeoutRunnable: Runnable? = null
    private var bestLocation: Location? = null

    fun request(maxAccuracyMeters: Float, timeoutMillis: Long, callback: (Map<String, Any?>) -> Unit) {
        cancel()
        if (!hasPrecisePermission()) {
            callback(error("precise_location_required"))
            return
        }
        if (!locationManager.isLocationEnabled) {
            callback(error("location_services_disabled"))
            return
        }
        val provider = selectProvider()
        if (provider == null) {
            callback(error("precise_provider_unavailable"))
            return
        }
        val startedAtNanos = SystemClock.elapsedRealtimeNanos()
        var completed = false
        fun finish(response: Map<String, Any?>) {
            if (completed) return
            completed = true
            cancel()
            callback(response)
        }
        val nextListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (!isFresh(location, startedAtNanos) || !isUsable(location)) return
                if (bestLocation == null || location.accuracy < bestLocation!!.accuracy) {
                    bestLocation = location
                }
                if (location.accuracy <= maxAccuracyMeters) finish(success(location, provider))
            }

            override fun onProviderDisabled(disabledProvider: String) {
                if (disabledProvider == provider) finish(error("location_services_disabled"))
            }

            @Deprecated("Deprecated in the Android framework")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
        }
        listener = nextListener
        val timeout = Runnable {
            val best = bestLocation
            if (best == null) finish(error("location_timeout")) else finish(success(best, provider))
        }
        timeoutRunnable = timeout
        try {
            locationManager.requestLocationUpdates(provider, 0L, 0f, nextListener, Looper.getMainLooper())
            handler.postDelayed(timeout, timeoutMillis.coerceIn(5_000L, 30_000L))
        } catch (_: SecurityException) {
            finish(error("precise_location_required"))
        } catch (_: IllegalArgumentException) {
            finish(error("precise_provider_unavailable"))
        }
    }

    fun cancel() {
        timeoutRunnable?.let(handler::removeCallbacks)
        timeoutRunnable = null
        listener?.let {
            try {
                locationManager.removeUpdates(it)
            } catch (_: SecurityException) {
                // Permission revocation must not prevent one-shot cleanup.
            }
        }
        listener = null
        bestLocation = null
    }

    private fun selectProvider(): String? {
        val enabled = locationManager.getProviders(true).toSet()
        return when {
            LocationManager.FUSED_PROVIDER in enabled -> LocationManager.FUSED_PROVIDER
            LocationManager.GPS_PROVIDER in enabled -> LocationManager.GPS_PROVIDER
            else -> null
        }
    }

    private fun hasPrecisePermission() =
        applicationContext.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
            applicationContext.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

    private fun isFresh(location: Location, startedAtNanos: Long) =
        location.elapsedRealtimeNanos > 0L &&
            location.elapsedRealtimeNanos + FRESHNESS_TOLERANCE_NANOS >= startedAtNanos

    private fun isUsable(location: Location) =
        location.latitude.isFinite() && location.latitude in -90.0..90.0 &&
            location.longitude.isFinite() && location.longitude in -180.0..180.0 &&
            location.hasAccuracy() && location.accuracy.isFinite() && location.accuracy >= 0f

    private fun success(location: Location, provider: String): Map<String, Any?> = mapOf(
        "ok" to true,
        "latitude" to location.latitude,
        "longitude" to location.longitude,
        "accuracy" to location.accuracy.toDouble(),
        "timestamp" to isoTimestamp(location.time),
        "source" to if (provider == LocationManager.GPS_PROVIDER) "gps" else "hybrid",
    )

    private fun error(code: String): Map<String, Any?> = mapOf("ok" to false, "code" to code)

    private fun isoTimestamp(epochMillis: Long): String =
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date(epochMillis))

    companion object {
        private const val FRESHNESS_TOLERANCE_NANOS = 1_000_000_000L
    }
}