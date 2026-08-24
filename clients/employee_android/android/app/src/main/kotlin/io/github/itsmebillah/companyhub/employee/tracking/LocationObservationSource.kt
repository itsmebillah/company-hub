package io.github.itsmebillah.companyhub.employee.tracking

/**
 * Native-only location observation boundary.
 *
 * Raw observations must remain inside the Android tracking service. They are
 * deliberately not part of the Flutter method-channel contract.
 */
interface LocationObservationSource {
    fun start(observer: Observer): StartResult

    fun stop()

    fun isObserving(): Boolean

    fun interface Observer {
        fun onEvent(event: Event)
    }

    sealed interface Event {
        data class Observation internal constructor(
            internal val latitude: Double,
            internal val longitude: Double,
            internal val accuracyMeters: Float,
            internal val observedAtEpochMillis: Long,
        ) : Event

        data class Suspended(val reason: String) : Event
    }

    sealed interface StartResult {
        data class Started(val provider: String) : StartResult

        data class Unavailable(val reason: String) : StartResult
    }
}
