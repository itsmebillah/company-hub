package dev.companyhub.provisional.employee.tracking

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import android.os.SystemClock

class LocationManagerObservationSource(
    context: Context,
) : LocationObservationSource {
    private val applicationContext = context.applicationContext
    private val locationManager =
        applicationContext.getSystemService(LocationManager::class.java)
    private val lock = Any()

    private var listener: LocationListener? = null
    private var activeProvider: String? = null
    private var generation = 0L

    override fun start(observer: LocationObservationSource.Observer): LocationObservationSource.StartResult {
        synchronized(lock) {
            stopLocked()
            if (!hasPrecisePermission()) {
                return LocationObservationSource.StartResult.Unavailable(
                    REASON_PRECISE_LOCATION_REQUIRED,
                )
            }
            if (!locationManager.isLocationEnabled) {
                return LocationObservationSource.StartResult.Unavailable(
                    REASON_LOCATION_SERVICES_DISABLED,
                )
            }
            val provider = selectProvider()
                ?: return LocationObservationSource.StartResult.Unavailable(
                    REASON_PRECISE_PROVIDER_UNAVAILABLE,
                )
            val currentGeneration = ++generation
            val startedAtElapsedRealtimeNanos = SystemClock.elapsedRealtimeNanos()
            val nextListener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    val event = synchronized(lock) {
                        if (
                            currentGeneration != generation ||
                            listener !== this ||
                            activeProvider != provider ||
                            !isFresh(location, startedAtElapsedRealtimeNanos)
                        ) {
                            null
                        } else {
                            LocationObservationSource.Event.Observation(
                                latitude = location.latitude,
                                longitude = location.longitude,
                                accuracyMeters = location.accuracy,
                                observedAtEpochMillis = location.time,
                            )
                        }
                    }
                    if (event != null) observer.onEvent(event)
                }

                override fun onProviderDisabled(disabledProvider: String) {
                    val shouldSuspend = synchronized(lock) {
                        if (
                            currentGeneration != generation ||
                            disabledProvider != activeProvider
                        ) {
                            false
                        } else {
                            stopLocked()
                            true
                        }
                    }
                    if (shouldSuspend) {
                        observer.onEvent(
                            LocationObservationSource.Event.Suspended(
                                REASON_PROVIDER_DISABLED,
                            ),
                        )
                    }
                }

                @Deprecated("Deprecated in the Android framework")
                override fun onStatusChanged(
                    provider: String?,
                    status: Int,
                    extras: Bundle?,
                ) = Unit
            }

            return try {
                listener = nextListener
                activeProvider = provider
                locationManager.requestLocationUpdates(
                    provider,
                    MIN_UPDATE_INTERVAL_MS,
                    MIN_UPDATE_DISTANCE_METERS,
                    nextListener,
                    Looper.getMainLooper(),
                )
                LocationObservationSource.StartResult.Started(provider)
            } catch (_: SecurityException) {
                stopLocked()
                LocationObservationSource.StartResult.Unavailable(
                    REASON_PRECISE_LOCATION_REQUIRED,
                )
            } catch (_: IllegalArgumentException) {
                stopLocked()
                LocationObservationSource.StartResult.Unavailable(
                    REASON_PRECISE_PROVIDER_UNAVAILABLE,
                )
            }
        }
    }

    override fun stop() {
        synchronized(lock) {
            stopLocked()
        }
    }

    override fun isObserving(): Boolean = synchronized(lock) { listener != null }

    private fun selectProvider(): String? {
        val enabledProviders = locationManager.getProviders(true).toSet()
        return when {
            LocationManager.FUSED_PROVIDER in enabledProviders -> LocationManager.FUSED_PROVIDER
            LocationManager.GPS_PROVIDER in enabledProviders -> LocationManager.GPS_PROVIDER
            else -> null
        }
    }

    private fun stopLocked() {
        generation += 1
        listener?.let {
            try {
                locationManager.removeUpdates(it)
            } catch (_: SecurityException) {
                // Permission revocation must not prevent local lifecycle cleanup.
            }
        }
        listener = null
        activeProvider = null
    }

    private fun hasPrecisePermission() =
        applicationContext.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED &&
            applicationContext.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun isFresh(location: Location, startedAtElapsedRealtimeNanos: Long): Boolean {
        val observationElapsedRealtimeNanos = location.elapsedRealtimeNanos
        return observationElapsedRealtimeNanos > 0L &&
            observationElapsedRealtimeNanos + FRESHNESS_TOLERANCE_NANOS >=
            startedAtElapsedRealtimeNanos
    }

    companion object {
        // Initial observation cadence only. Adaptive sampling is a later milestone.
        private const val MIN_UPDATE_INTERVAL_MS = 30_000L
        private const val MIN_UPDATE_DISTANCE_METERS = 0f
        private const val FRESHNESS_TOLERANCE_NANOS = 1_000_000_000L

        const val REASON_LOCATION_SERVICES_DISABLED = "location_services_disabled"
        const val REASON_PRECISE_LOCATION_REQUIRED = "precise_location_required"
        const val REASON_PRECISE_PROVIDER_UNAVAILABLE = "precise_provider_unavailable"
        const val REASON_PROVIDER_DISABLED = "location_provider_disabled"
    }
}
