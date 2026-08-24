package io.github.itsmebillah.companyhub.employee.tracking

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class LocationIngestionClientTest {
    @Test
    fun `success and duplicate success are terminal success`() {
        assertTrue(LocationIngestionClient.classifyResponse(202, null) is LocationIngestionClient.Result.Success)
        assertTrue(LocationIngestionClient.classifyResponse(200, null) is LocationIngestionClient.Result.Success)
    }

    @Test
    fun `429 and 503 honor bounded numeric retry after`() {
        assertEquals(
            17_000L,
            (LocationIngestionClient.classifyResponse(429, "17") as LocationIngestionClient.Result.Retryable)
                .retryAfterMillis,
        )
        assertEquals(
            15 * 60_000L,
            (LocationIngestionClient.classifyResponse(503, "999999") as LocationIngestionClient.Result.Retryable)
                .retryAfterMillis,
        )
    }

    @Test
    fun `authentication and closed session require reconciliation`() {
        assertTrue(
            LocationIngestionClient.classifyResponse(401, null) is
                LocationIngestionClient.Result.AuthenticationRequired,
        )
        assertEquals(
            "active_session_required",
            (LocationIngestionClient.classifyResponse(409, null) as LocationIngestionClient.Result.Rejected)
                .reason,
        )
    }
}
