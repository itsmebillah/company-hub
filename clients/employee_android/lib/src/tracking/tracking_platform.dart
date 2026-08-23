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
  static const channelName = 'dev.companyhub.provisional.employee/tracking';
  static const startTracking = 'startTracking';
  static const stopTracking = 'stopTracking';
  static const getTrackingState = 'getTrackingState';
  static const requestRequiredPermissions = 'requestRequiredPermissions';
  static const retryPending = 'retryPending';
}
