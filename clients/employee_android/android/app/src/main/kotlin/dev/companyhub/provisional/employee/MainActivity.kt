package dev.companyhub.provisional.employee

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import dev.companyhub.provisional.employee.tracking.DutyTrackingService
import dev.companyhub.provisional.employee.tracking.TrackingRuntime
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var permissionResult: MethodChannel.Result? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            TRACKING_CHANNEL,
        ).setMethodCallHandler(::handleTrackingCall)
    }

    override fun onResume() {
        super.onResume()
        enforceActivePrerequisites()
    }

    private fun handleTrackingCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "startTracking" -> startTracking(call, result)
            "stopTracking" -> {
                stopDutyTracking("server_session_closed")
                result.success(TrackingRuntime.response())
            }
            "getTrackingState" -> {
                enforceActivePrerequisites()
                result.success(currentPermissionAwareState())
            }
            "requestRequiredPermissions" -> requestRequiredPermissions(result)
            "retryPending" -> {
                enforceActivePrerequisites()
                DutyTrackingService.retryPending()
                result.success(currentPermissionAwareState())
            }
            else -> result.notImplemented()
        }
    }

    private fun startTracking(call: MethodCall, result: MethodChannel.Result) {
        val serverAuthorized = call.argument<Boolean>("serverAuthorized") == true
        val sessionId = call.argument<String>("trackingSessionId")?.trim().orEmpty()
        val apiBaseUrl = call.argument<String>("apiBaseUrl")?.trim().orEmpty()
        val accessToken = call.argument<String>("accessToken")?.trim().orEmpty()
        if (
            !serverAuthorized || sessionId.isEmpty() || apiBaseUrl.isEmpty() ||
            accessToken.isEmpty()
        ) {
            stopDutyTracking("server_session_required")
            TrackingRuntime.update("suspended", "server_session_required")
            result.success(TrackingRuntime.response())
            return
        }
        val prerequisite = permissionState()
        if (prerequisite.first != "ready") {
            stopDutyTracking(prerequisite.second)
            TrackingRuntime.update(prerequisite.first, prerequisite.second)
            result.success(TrackingRuntime.response())
            return
        }
        TrackingRuntime.update("starting", null, sessionId)
        val intent = Intent(this, DutyTrackingService::class.java).apply {
            action = DutyTrackingService.ACTION_START
            putExtra(DutyTrackingService.EXTRA_SESSION_ID, sessionId)
            putExtra(DutyTrackingService.EXTRA_SERVER_AUTHORIZED, true)
            putExtra(DutyTrackingService.EXTRA_API_BASE_URL, apiBaseUrl)
            putExtra(DutyTrackingService.EXTRA_ACCESS_TOKEN, accessToken)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
            completeStartWhenSettled(result, System.currentTimeMillis())
        } catch (_: RuntimeException) {
            stopDutyTracking("foreground_service_start_failed")
            TrackingRuntime.update("error", "foreground_service_start_failed")
            result.success(TrackingRuntime.response())
        }
    }

    private fun completeStartWhenSettled(
        result: MethodChannel.Result,
        startedAtMillis: Long,
    ) {
        if (TrackingRuntime.state != "starting") {
            result.success(TrackingRuntime.response())
            return
        }
        if (System.currentTimeMillis() - startedAtMillis >= START_SETTLE_TIMEOUT_MS) {
            stopDutyTracking("foreground_service_start_timeout")
            TrackingRuntime.update("error", "foreground_service_start_timeout")
            result.success(TrackingRuntime.response())
            return
        }
        mainHandler.postDelayed(
            { completeStartWhenSettled(result, startedAtMillis) },
            START_SETTLE_POLL_INTERVAL_MS,
        )
    }

    private fun requestRequiredPermissions(result: MethodChannel.Result) {
        if (permissionResult != null) {
            result.success(TrackingRuntime.response())
            return
        }
        permissionResult = result
        if (!hasPreciseLocation()) {
            getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                .edit()
                .putBoolean(LOCATION_REQUESTED, true)
                .apply()
            requestPermissions(
                arrayOf(
                    Manifest.permission.ACCESS_COARSE_LOCATION,
                    Manifest.permission.ACCESS_FINE_LOCATION,
                ),
                LOCATION_REQUEST_CODE,
            )
            return
        }
        requestNotificationIfNeeded()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            LOCATION_REQUEST_CODE -> {
                if (hasPreciseLocation()) {
                    requestNotificationIfNeeded()
                } else {
                    completePermissionRequest("permission_denied", "precise_location_required")
                }
            }
            NOTIFICATION_REQUEST_CODE -> {
                if (hasNotificationPermission()) {
                    completePermissionRequest("ready", null)
                } else {
                    completePermissionRequest(
                        "notification_required",
                        "notification_permission_required",
                    )
                }
            }
        }
    }

    private fun requestNotificationIfNeeded() {
        if (hasNotificationPermission()) {
            completePermissionRequest("ready", null)
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(
                arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                NOTIFICATION_REQUEST_CODE,
            )
        }
    }

    private fun completePermissionRequest(state: String, reason: String?) {
        TrackingRuntime.update(state, reason)
        permissionResult?.success(TrackingRuntime.response())
        permissionResult = null
    }

    private fun currentPermissionAwareState(): Map<String, Any?> {
        if (TrackingRuntime.state == "active" || TrackingRuntime.state == "starting") {
            return TrackingRuntime.response()
        }
        val prerequisite = permissionState()
        if (prerequisite.first != "ready") {
            TrackingRuntime.update(prerequisite.first, prerequisite.second)
        } else if (
            TrackingRuntime.state in
            setOf("permission_required", "permission_denied", "notification_required")
        ) {
            TrackingRuntime.update("ready", null)
        }
        return TrackingRuntime.response()
    }

    private fun permissionState(): Pair<String, String?> {
        if (!packageManager.hasSystemFeature(PackageManager.FEATURE_LOCATION)) {
            return "unavailable" to "location_unavailable"
        }
        if (!hasPreciseLocation()) {
            val requested = getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                .getBoolean(LOCATION_REQUESTED, false)
            return if (requested) {
                "permission_denied" to "precise_location_required"
            } else {
                "permission_required" to "precise_location_required"
            }
        }
        if (!hasNotificationPermission()) {
            return "notification_required" to "notification_permission_required"
        }
        return "ready" to null
    }

    private fun enforceActivePrerequisites() {
        if (TrackingRuntime.state != "active" && TrackingRuntime.state != "starting") return
        val prerequisite = permissionState()
        if (prerequisite.first != "ready") {
            stopDutyTracking(prerequisite.second)
            TrackingRuntime.update("suspended", prerequisite.second)
        }
    }

    private fun stopDutyTracking(reason: String?) {
        if (TrackingRuntime.state == "active" || TrackingRuntime.state == "starting") {
            TrackingRuntime.update("stopping", reason)
        }
        stopService(Intent(this, DutyTrackingService::class.java))
        TrackingRuntime.update("stopped", reason)
    }

    private fun hasPreciseLocation() =
        checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED &&
            checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    private fun hasNotificationPermission() =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED

    companion object {
        private const val TRACKING_CHANNEL = "dev.companyhub.provisional.employee/tracking"
        private const val PREFERENCES = "company_hub_tracking_permissions"
        private const val LOCATION_REQUESTED = "location_requested"
        private const val LOCATION_REQUEST_CODE = 51045
        private const val NOTIFICATION_REQUEST_CODE = 51046
        private const val START_SETTLE_POLL_INTERVAL_MS = 50L
        private const val START_SETTLE_TIMEOUT_MS = 2_000L
    }
}
