import 'package:flutter/foundation.dart';

import '../models/attendance_state.dart';
import 'tracking_platform.dart';

class TrackingController extends ChangeNotifier {
  TrackingController({required TrackingPlatform platform}) : this._(platform);

  TrackingController._(this._platform);

  final TrackingPlatform _platform;
  TrackingStatus status = const TrackingStatus(state: TrackingState.stopped);
  String? _authorizedSessionId;
  String? _apiBaseUrl;
  String? _accessToken;
  bool _operationInProgress = false;
  AttendanceState? _pendingAttendance;
  bool _hasPendingAttendance = false;

  bool get hasServerAuthorizedSession => _authorizedSessionId != null;

  Future<void> reconcile(
    AttendanceState? attendance, {
    String? apiBaseUrl,
    String? accessToken,
  }) async {
    _apiBaseUrl = apiBaseUrl;
    _accessToken = accessToken;
    _pendingAttendance = attendance;
    _hasPendingAttendance = true;
    if (_operationInProgress) return;
    _operationInProgress = true;
    try {
      while (_hasPendingAttendance) {
        final nextAttendance = _pendingAttendance;
        _hasPendingAttendance = false;
        final tracking = nextAttendance?.tracking;
        final sessionId = tracking?.sessionId;
        final isAuthorized = tracking?.status == 'active' && sessionId != null;
        final transportReady =
            apiBaseUrl != null && accessToken != null && accessToken.isNotEmpty;
        _authorizedSessionId = isAuthorized && transportReady
            ? sessionId
            : null;
        if (!isAuthorized || !transportReady) {
          status = await _platform.stopTracking();
        } else {
          status = await _platform.startTracking(
            trackingSessionId: sessionId,
            serverAuthorized: true,
            apiBaseUrl: apiBaseUrl,
            accessToken: accessToken,
          );
        }
      }
    } finally {
      _operationInProgress = false;
      notifyListeners();
    }
  }

  Future<void> requestRequiredPermissions() async {
    status = await _platform.requestRequiredPermissions();
    notifyListeners();
    final sessionId = _authorizedSessionId;
    final apiBaseUrl = _apiBaseUrl;
    final accessToken = _accessToken;
    if (sessionId != null &&
        apiBaseUrl != null &&
        accessToken != null &&
        status.state == TrackingState.ready) {
      status = await _platform.startTracking(
        trackingSessionId: sessionId,
        serverAuthorized: true,
        apiBaseUrl: apiBaseUrl,
        accessToken: accessToken,
      );
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    status = await _platform.getTrackingState();
    notifyListeners();
  }
}
