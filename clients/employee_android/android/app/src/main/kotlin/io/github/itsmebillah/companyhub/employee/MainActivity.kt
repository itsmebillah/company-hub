package io.github.itsmebillah.companyhub.employee

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import io.github.itsmebillah.companyhub.employee.tracking.CurrentPositionProvider
import io.github.itsmebillah.companyhub.employee.updates.AppUpdateInstaller
import io.github.itsmebillah.companyhub.employee.tracking.DutyTrackingService
import io.github.itsmebillah.companyhub.employee.tracking.TrackingRuntime
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private var permissionResult: MethodChannel.Result? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private val currentPositionProvider by lazy { CurrentPositionProvider(this) }
    private val appUpdateInstaller by lazy { AppUpdateInstaller(applicationContext) }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            TRACKING_CHANNEL,
        ).setMethodCallHandler(::handleTrackingCall)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            UPDATE_CHANNEL,
        ).setMethodCallHandler(::handleUpdateCall)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            EXTERNAL_LINK_CHANNEL,
        ).setMethodCallHandler(::handleExternalLinkCall)
    }

    override fun onDestroy() {
        currentPositionProvider.cancel()
        appUpdateInstaller.close()
        super.onDestroy()
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
            "openAppSettings" -> openAppSettings(result)
            "getCurrentPosition" -> getCurrentPosition(call, result)
            "retryPending" -> {
                enforceActivePrerequisites()
                DutyTrackingService.retryPending()
                result.success(currentPermissionAwareState())
            }
            else -> result.notImplemented()
        }
    }

    private fun handleUpdateCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "getInstalledInfo" -> result.success(appUpdateInstaller.installedInfo())
            "downloadAndInstall" -> {
                val apkUrl = call.argument<String>("apkUrl").orEmpty()
                val sha256 = call.argument<String>("sha256").orEmpty()
                val versionCode = call.argument<Number>("versionCode")?.toLong() ?: -1L
                appUpdateInstaller.downloadAndInstall(apkUrl, sha256, versionCode, result::success)
            }
            else -> result.notImplemented()
        }
    }

    private fun handleExternalLinkCall(call: MethodCall, result: MethodChannel.Result) {
        if (call.method != "open") {
            result.notImplemented()
            return
        }
        val value = call.argument<String>("url")?.trim().orEmpty()
        val uri = runCatching { Uri.parse(value) }.getOrNull()
        if (uri == null || uri.scheme !in setOf("https", "http")) {
            result.success(false)
            return
        }
        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE),
            )
            result.success(true)
        } catch (_: RuntimeException) {
            result.success(false)
        }
    }
    private fun getCurrentPosition(call: MethodCall, result: MethodChannel.Result) {
        val maxAccuracyMeters = call.argument<Number>("maxAccuracyMeters")?.toFloat() ?: 50f
        val timeoutMillis = call.argument<Number>("timeoutMillis")?.toLong() ?: 15_000L
        currentPositionProvider.request(maxAccuracyMeters, timeoutMillis, result::success)
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
            result.success(currentPermissionAwareState())
            return
        }
        permissionResult = result
        when (permissionState().first) {
            "permission_required", "permission_denied" -> {
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
            }
            "notification_required" -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    getSharedPreferences(PREFERENCES, MODE_PRIVATE)
                        .edit()
                        .putBoolean(NOTIFICATION_REQUESTED, true)
                        .apply()
                    requestPermissions(
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                        NOTIFICATION_REQUEST_CODE,
                    )
                } else {
                    completePermissionRequest("ready", null)
                }
            }
            else -> completePermissionRequestFromCurrentState()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            LOCATION_REQUEST_CODE,
            NOTIFICATION_REQUEST_CODE,
            -> completePermissionRequestFromCurrentState()
        }
    }

    private fun completePermissionRequestFromCurrentState() {
        val current = permissionState()
        completePermissionRequest(current.first, current.second)
    }

    private fun openAppSettings(result: MethodChannel.Result) {
        try {
            startActivity(
                Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:$packageName"),
                ),
            )
            result.success(true)
        } catch (_: RuntimeException) {
            result.success(false)
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
        val preferences = getSharedPreferences(PREFERENCES, MODE_PRIVATE)
        if (!hasPreciseLocation()) {
            val requested = preferences.getBoolean(LOCATION_REQUESTED, false)
            val permanentlyDenied =
                requested &&
                    !shouldShowRequestPermissionRationale(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                    )
            return when {
                permanentlyDenied ->
                    "permission_denied" to "precise_location_permanently_denied"
                requested -> "permission_denied" to "precise_location_required"
                else -> "permission_required" to "precise_location_required"
            }
        }
        if (!hasNotificationPermission()) {
            val requested = preferences.getBoolean(NOTIFICATION_REQUESTED, false)
            val permanentlyDenied =
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    requested &&
                    !shouldShowRequestPermissionRationale(
                        Manifest.permission.POST_NOTIFICATIONS,
                    )
            return when {
                permanentlyDenied ->
                    "notification_required" to
                        "notification_permission_permanently_denied"
                requested ->
                    "notification_required" to "notification_permission_denied"
                else ->
                    "notification_required" to "notification_permission_required"
            }
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
        private const val TRACKING_CHANNEL = "io.github.itsmebillah.companyhub.employee/tracking"
        private const val UPDATE_CHANNEL = "io.github.itsmebillah.companyhub.employee/updates"
        private const val EXTERNAL_LINK_CHANNEL = "io.github.itsmebillah.companyhub.employee/external-links"
        private const val PREFERENCES = "company_hub_tracking_permissions"
        private const val LOCATION_REQUESTED = "location_requested"
        private const val NOTIFICATION_REQUESTED = "notification_requested"
        private const val LOCATION_REQUEST_CODE = 51045
        private const val NOTIFICATION_REQUEST_CODE = 51046
        private const val START_SETTLE_POLL_INTERVAL_MS = 50L
        private const val START_SETTLE_TIMEOUT_MS = 2_000L
    }
}
