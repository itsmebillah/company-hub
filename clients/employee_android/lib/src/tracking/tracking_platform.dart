import 'package:flutter/services.dart';

enum TrackingState {
  unavailable,
  permissionRequired,
  permissionDenied,
  notificationRequired,
  ready,
  starting,
  active,
  suspended,
  stopping,
  stopped,
  error,
}

class AttendanceGps {
  const AttendanceGps({
    required this.latitude,
    required this.longitude,
    required this.accuracy,
    required this.timestamp,
    this.source = 'gps',
  });

  factory AttendanceGps.fromMap(Map<Object?, Object?> value) => AttendanceGps(
    latitude: (value['latitude'] as num).toDouble(),
    longitude: (value['longitude'] as num).toDouble(),
    accuracy: (value['accuracy'] as num).toDouble(),
    timestamp: value['timestamp'] as String,
    source: value['source'] as String? ?? 'gps',
  );

  final double latitude;
  final double longitude;
  final double accuracy;
  final String timestamp;
  final String source;

  bool get isUsable =>
      latitude.isFinite &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude.isFinite &&
      longitude >= -180 &&
      longitude <= 180 &&
      accuracy.isFinite &&
      accuracy >= 0;

  Map<String, Object?> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    'accuracy': accuracy,
    'timestamp': timestamp,
    'source': source,
  };
}

class AttendanceLocationException implements Exception {
  const AttendanceLocationException(this.code);

  final String code;

  String get userMessage => switch (code) {
    'precise_location_required' || 'precise_location_permanently_denied' =>
      'Precise location permission is required for attendance.',
    'location_services_disabled' =>
      'Turn on Android Location services, then try again.',
    'precise_provider_unavailable' || 'location_unavailable' => 'A current GPS position is unavailable. Move to an open area and try again.',
    'location_timeout' => 'A current GPS position could not be obtained in time. Try again outdoors.',
    _ => 'Current GPS location is unavailable. Please try again.',
  };
}

class TrackingStatus {
  const TrackingStatus({
    required this.state,
    this.reason,
    this.pendingPointCount = 0,
    this.syncState = 'idle',
  });

  factory TrackingStatus.fromMap(Map<Object?, Object?> value) {
    final rawState = value['state'];
    if (rawState is! String) {
      return const TrackingStatus(
        state: TrackingState.error,
        reason: 'invalid_native_state',
      );
    }
    final matches = TrackingState.values.where(
      (candidate) => candidate.wireName == rawState,
    );
    return TrackingStatus(
      state: matches.isEmpty ? TrackingState.error : matches.first,
      reason: value['reason'] as String?,
      pendingPointCount: value['pendingPointCount'] as int? ?? 0,
      syncState: value['syncState'] as String? ?? 'idle',
    );
  }

  final TrackingState state;
  final String? reason;
  final int pendingPointCount;
  final String syncState;

  bool get isActive => state == TrackingState.active;
  bool get requiresPermissionGate => switch (state) {
    TrackingState.unavailable ||
    TrackingState.permissionRequired ||
    TrackingState.permissionDenied ||
    TrackingState.notificationRequired ||
    TrackingState.error => true,
    _ => false,
  };
  bool get isPermanentlyDenied =>
      reason == 'precise_location_permanently_denied' ||
      reason == 'notification_permission_permanently_denied';
}

extension TrackingStateWireName on TrackingState {
  String get wireName => switch (this) {
    TrackingState.permissionRequired => 'permission_required',
    TrackingState.permissionDenied => 'permission_denied',
    TrackingState.notificationRequired => 'notification_required',
    _ => name,
  };
}

abstract interface class TrackingPlatform {
  Future<TrackingStatus> startTracking({
    required String trackingSessionId,
    required bool serverAuthorized,
    required String apiBaseUrl,
    required String accessToken,
  });
  Future<TrackingStatus> stopTracking();
  Future<TrackingStatus> getTrackingState();
  Future<TrackingStatus> requestRequiredPermissions();
  Future<bool> openAppSettings();
  Future<AttendanceGps> getCurrentPosition({
    required double maxAccuracyMeters,
    Duration timeout = const Duration(seconds: 15),
  });
  Future<TrackingStatus> retryPending();
}

class MethodChannelTrackingPlatform implements TrackingPlatform {
  MethodChannelTrackingPlatform({MethodChannel? channel})
    : _channel =
          channel ?? const MethodChannel(TrackingChannelContract.channelName);
  final MethodChannel _channel;

  @override
  Future<TrackingStatus> startTracking({
    required String trackingSessionId,
    required bool serverAuthorized,
    required String apiBaseUrl,
    required String accessToken,
  }) => _invoke(TrackingChannelContract.startTracking, {
    'trackingSessionId': trackingSessionId,
    'serverAuthorized': serverAuthorized,
    'apiBaseUrl': apiBaseUrl,
    'accessToken': accessToken,
  });
  @override
  Future<TrackingStatus> stopTracking() =>
      _invoke(TrackingChannelContract.stopTracking);
  @override
  Future<TrackingStatus> getTrackingState() =>
      _invoke(TrackingChannelContract.getTrackingState);
  @override
  Future<TrackingStatus> requestRequiredPermissions() =>
      _invoke(TrackingChannelContract.requestRequiredPermissions);

  @override
  Future<bool> openAppSettings() async {
    try {
      return await _channel.invokeMethod<bool>(
            TrackingChannelContract.openAppSettings,
          ) ??
          false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  @override
  Future<AttendanceGps> getCurrentPosition({
    required double maxAccuracyMeters,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    try {
      final response = await _channel.invokeMapMethod<Object?, Object?>(
        TrackingChannelContract.getCurrentPosition,
        {
          'maxAccuracyMeters': maxAccuracyMeters,
          'timeoutMillis': timeout.inMilliseconds,
        },
      );
      if (response == null || response['ok'] != true) {
        throw AttendanceLocationException(
          response?['code'] as String? ?? 'location_unavailable',
        );
      }
      return AttendanceGps.fromMap(response);
    } on PlatformException catch (error) {
      throw AttendanceLocationException(error.code);
    } on MissingPluginException {
      throw const AttendanceLocationException('location_unavailable');
    }
  }

  @override
  Future<TrackingStatus> retryPending() =>
      _invoke(TrackingChannelContract.retryPending);

  Future<TrackingStatus> _invoke(
    String method, [
    Map<String, Object?>? arguments,
  ]) async {
    try {
      final response = await _channel.invokeMapMethod<Object?, Object?>(
        method,
        arguments,
      );
      if (response == null) {
        return const TrackingStatus(
          state: TrackingState.error,
          reason: 'empty_native_response',
        );
      }
      return TrackingStatus.fromMap(response);
    } on PlatformException {
      return const TrackingStatus(
        state: TrackingState.error,
        reason: 'native_tracking_unavailable',
      );
    } on MissingPluginException {
      return const TrackingStatus(
        state: TrackingState.unavailable,
        reason: 'native_tracking_unavailable',
      );
    }
  }
}

abstract final class TrackingChannelContract {
  static const channelName =
      'io.github.itsmebillah.companyhub.employee/tracking';
  static const startTracking = 'startTracking';
  static const stopTracking = 'stopTracking';
  static const getTrackingState = 'getTrackingState';
  static const requestRequiredPermissions = 'requestRequiredPermissions';
  static const openAppSettings = 'openAppSettings';
  static const getCurrentPosition = 'getCurrentPosition';
  static const retryPending = 'retryPending';
}
