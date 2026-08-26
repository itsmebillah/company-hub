package io.github.itsmebillah.companyhub.employee.tracking

internal object TrackingCadence {
    const val OBSERVATION_INTERVAL_MS = 30 * 60_000L
    const val IDLE_FLUSH_INTERVAL_MS = OBSERVATION_INTERVAL_MS
    const val IMMEDIATE_FLUSH_DELAY_MS = 0L

    fun delayAfterSuccessfulUpload(pendingCount: Int): Long =
        if (pendingCount == 0) IDLE_FLUSH_INTERVAL_MS else IMMEDIATE_FLUSH_DELAY_MS
}
