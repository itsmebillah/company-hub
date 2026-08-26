package io.github.itsmebillah.companyhub.employee.tracking

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TrackingCadenceTest {
    @Test
    fun `observation and idle upload cadence is thirty minutes`() {
        val thirtyMinutes = 30 * 60_000L

        assertEquals(thirtyMinutes, TrackingCadence.OBSERVATION_INTERVAL_MS)
        assertEquals(thirtyMinutes, TrackingCadence.IDLE_FLUSH_INTERVAL_MS)
        assertTrue(TrackingCadence.OBSERVATION_INTERVAL_MS in 20 * 60_000L..40 * 60_000L)
    }

    @Test
    fun `new observations and queued backlog remain eligible for immediate upload`() {
        assertEquals(0L, TrackingCadence.IMMEDIATE_FLUSH_DELAY_MS)
        assertEquals(0L, TrackingCadence.delayAfterSuccessfulUpload(pendingCount = 1))
        assertEquals(
            TrackingCadence.IDLE_FLUSH_INTERVAL_MS,
            TrackingCadence.delayAfterSuccessfulUpload(pendingCount = 0),
        )
    }
}
