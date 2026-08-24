package io.github.itsmebillah.companyhub.employee.tracking

object TrackingRuntime {
    @Volatile
    var state: String = "stopped"
        private set

    @Volatile
    private var reason: String? = null

    @Volatile
    var sessionId: String? = null
        private set

    private var observationCount: Long = 0
    private var observationProvider: String? = null
    private var pendingPointCount: Int = 0
    private var syncState: String = "idle"

    @Synchronized
    fun update(nextState: String, nextReason: String?, nextSessionId: String? = sessionId) {
        state = nextState
        reason = nextReason
        sessionId = nextSessionId
        if (nextState == "stopped" || nextState == "error") {
            sessionId = null
            observationProvider = null
            pendingPointCount = 0
            syncState = "idle"
        }
    }

    @Synchronized
    fun observationStarted(provider: String) {
        observationCount = 0
        observationProvider = provider
    }

    @Synchronized
    fun observationReceived() {
        observationCount += 1
    }

    @Synchronized
    fun observationStopped() {
        observationProvider = null
    }

    @Synchronized
    fun syncHealth(pendingCount: Int, nextSyncState: String) {
        pendingPointCount = pendingCount
        syncState = nextSyncState
    }

    @Synchronized
    fun response(): Map<String, Any?> = mapOf(
        "state" to state,
        "reason" to reason,
        "observationActive" to (observationProvider != null),
        "observationProvider" to observationProvider,
        "observationCount" to observationCount,
        "pendingPointCount" to pendingPointCount,
        "syncState" to syncState,
    )
}
