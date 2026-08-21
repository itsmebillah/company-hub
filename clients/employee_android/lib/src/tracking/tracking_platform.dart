/// Future native tracking states defined by ADR-016.
///
/// No location or foreground-service behavior is implemented in this milestone.
enum TrackingState { unavailable, inactive, active, suspended }

/// Contract that a future Android platform-channel adapter must implement.
abstract interface class TrackingPlatform {
  Future<void> startTracking();

  Future<void> stopTracking();

  Future<TrackingState> getTrackingState();

  Future<void> retryPending();
}

/// Stable channel and method names reserved for the future native boundary.
abstract final class TrackingChannelContract {
  static const channelName = 'dev.companyhub.provisional.employee/tracking';
  static const startTracking = 'startTracking';
  static const stopTracking = 'stopTracking';
  static const getTrackingState = 'getTrackingState';
  static const retryPending = 'retryPending';
}
