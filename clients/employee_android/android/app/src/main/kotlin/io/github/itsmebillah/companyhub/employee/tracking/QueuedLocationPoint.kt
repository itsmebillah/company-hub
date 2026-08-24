package io.github.itsmebillah.companyhub.employee.tracking

internal data class QueuedLocationPoint(
    val trackingSessionId: String,
    val idempotencyKey: String,
    val observedAtEpochMillis: Long,
    val latitude: Double,
    val longitude: Double,
    val accuracyMeters: Float,
)
