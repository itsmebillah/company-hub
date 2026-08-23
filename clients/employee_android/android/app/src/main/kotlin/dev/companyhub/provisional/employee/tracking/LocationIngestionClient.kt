package dev.companyhub.provisional.employee.tracking

import java.net.HttpURLConnection
import java.net.URI
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject

internal class LocationIngestionClient {
    sealed interface Result {
        data object Success : Result
        data class Retryable(val retryAfterMillis: Long) : Result
        data object AuthenticationRequired : Result
        data class Rejected(val reason: String) : Result
    }

    fun submit(
        apiBaseUrl: String,
        accessToken: String,
        points: List<QueuedLocationPoint>,
    ): Result {
        if (points.isEmpty()) return Result.Success
        val uri = URI(apiBaseUrl).resolve("/api/location/points")
        require(uri.scheme == "https") { "Location ingestion requires HTTPS." }
        val body = JSONObject().put(
            "points",
            JSONArray().apply {
                points.forEach { point ->
                    put(
                        JSONObject()
                            .put("idempotencyKey", point.idempotencyKey)
                            .put("observedAt", Instant.ofEpochMilli(point.observedAtEpochMillis).toString())
                            .put("latitude", point.latitude)
                            .put("longitude", point.longitude)
                            .put("accuracyMeters", point.accuracyMeters.toDouble()),
                    )
                }
            },
        ).toString().toByteArray(Charsets.UTF_8)
        require(body.size <= MAX_REQUEST_BYTES) { "Location ingestion request exceeds its bound." }
        val connection = uri.toURL().openConnection() as HttpURLConnection
        return try {
            connection.requestMethod = "POST"
            connection.connectTimeout = CONNECT_TIMEOUT_MS
            connection.readTimeout = READ_TIMEOUT_MS
            connection.doOutput = true
            connection.setFixedLengthStreamingMode(body.size)
            connection.setRequestProperty("Authorization", "Bearer $accessToken")
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Accept", "application/json")
            connection.outputStream.use { it.write(body) }
            when (connection.responseCode) {
                in 200..299 -> Result.Success
                429, 503 -> Result.Retryable(parseRetryAfter(connection.getHeaderField("Retry-After")))
                401 -> Result.AuthenticationRequired
                403 -> Result.Rejected("session_not_authorized")
                409 -> Result.Rejected("active_session_required")
                else -> if (connection.responseCode >= 500) {
                    Result.Retryable(DEFAULT_RETRY_MILLIS)
                } else {
                    Result.Rejected("ingestion_rejected")
                }
            }
        } catch (_: Exception) {
            Result.Retryable(DEFAULT_RETRY_MILLIS)
        } finally {
            connection.disconnect()
        }
    }

    private fun parseRetryAfter(value: String?): Long {
        val seconds = value?.trim()?.toLongOrNull()?.coerceIn(1, MAX_RETRY_AFTER_SECONDS)
        return (seconds ?: DEFAULT_RETRY_SECONDS) * 1_000L
    }

    companion object {
        const val MAX_REQUEST_BYTES = 128 * 1024
        private const val CONNECT_TIMEOUT_MS = 10_000
        private const val READ_TIMEOUT_MS = 15_000
        private const val DEFAULT_RETRY_SECONDS = 30L
        private const val DEFAULT_RETRY_MILLIS = DEFAULT_RETRY_SECONDS * 1_000L
        private const val MAX_RETRY_AFTER_SECONDS = 15 * 60L
    }
}
