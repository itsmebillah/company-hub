import 'dart:async';

import 'package:employee_android/src/tracking/tracking_controller.dart';
import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

class FakeTrackingPlatform implements TrackingPlatform {
  TrackingStatus current = const TrackingStatus(state: TrackingState.stopped);
  TrackingStatus permissionResult = const TrackingStatus(
    state: TrackingState.ready,
  );
  TrackingStatus startResult = const TrackingStatus(
    state: TrackingState.active,
  );
  int startCalls = 0;
  int stopCalls = 0;
  String? receivedSessionId;
  bool? receivedServerAuthorized;

  @override
  Future<AttendanceGps> getCurrentPosition({
    required double maxAccuracyMeters,
    Duration timeout = const Duration(seconds: 15),
  }) async => const AttendanceGps(
    latitude: 23.7806,
    longitude: 90.4070,
    accuracy: 12,
    timestamp: '2026-08-21T09:00:00.000Z',
  );
  @override
  Future<TrackingStatus> getTrackingState() async => current;

  @override
  Future<bool> openAppSettings() async => true;

  @override
  Future<TrackingStatus> requestRequiredPermissions() async => permissionResult;

  @override
  Future<TrackingStatus> retryPending() async => current;

  @override
  Future<TrackingStatus> startTracking({
    required String trackingSessionId,
    required bool serverAuthorized,
    required String apiBaseUrl,
    required String accessToken,
  }) async {
    startCalls += 1;
    receivedSessionId = trackingSessionId;
    receivedServerAuthorized = serverAuthorized;
    current = startResult;
    return current;
  }

  @override
  Future<TrackingStatus> stopTracking() async {
    stopCalls += 1;
    current = const TrackingStatus(state: TrackingState.stopped);
    return current;
  }
}

class DelayedStopTrackingPlatform extends FakeTrackingPlatform {
  final stopGate = Completer<void>();

  @override
  Future<TrackingStatus> stopTracking() async {
    await stopGate.future;
    return super.stopTracking();
  }
}

void main() {
  test('does not start without a server-authorized duty session', () async {
    final platform = FakeTrackingPlatform();
    final controller = TrackingController(platform: platform);
    await controller.reconcile(
      testAttendance(),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    expect(platform.startCalls, 0);
    expect(platform.stopCalls, 1);
    expect(controller.status.state, TrackingState.stopped);
  });

  test(
    'does not start an authorized session without transport authorization',
    () async {
      final platform = FakeTrackingPlatform();
      final controller = TrackingController(platform: platform);
      await controller.reconcile(testAttendance(checkedIn: true));
      expect(platform.startCalls, 0);
      expect(platform.stopCalls, 1);
    },
  );

  test('uses only the authoritative tracking session ID to start', () async {
    final platform = FakeTrackingPlatform();
    final controller = TrackingController(platform: platform);
    await controller.reconcile(
      testAttendance(checkedIn: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    expect(platform.startCalls, 1);
    expect(platform.receivedSessionId, 'tracking-a');
    expect(platform.receivedServerAuthorized, isTrue);
    expect(controller.status.state, TrackingState.active);
  });

  test('permission denial never claims active tracking', () async {
    final platform = FakeTrackingPlatform()
      ..startResult = const TrackingStatus(
        state: TrackingState.permissionDenied,
        reason: 'precise_location_required',
      );
    final controller = TrackingController(platform: platform);
    await controller.reconcile(
      testAttendance(checkedIn: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    expect(controller.status.state, TrackingState.permissionDenied);
    expect(controller.status.isActive, isFalse);
  });

  test('permission success retries only the authorized session', () async {
    final platform = FakeTrackingPlatform()
      ..startResult = const TrackingStatus(
        state: TrackingState.permissionRequired,
      );
    final controller = TrackingController(platform: platform);
    await controller.reconcile(
      testAttendance(checkedIn: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    platform.startResult = const TrackingStatus(state: TrackingState.active);
    await controller.requestRequiredPermissions();
    expect(platform.startCalls, 2);
    expect(platform.receivedSessionId, 'tracking-a');
    expect(controller.status.state, TrackingState.active);
  });

  test('checkout stops the native service immediately', () async {
    final platform = FakeTrackingPlatform();
    final controller = TrackingController(platform: platform);
    await controller.reconcile(
      testAttendance(checkedIn: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    await controller.reconcile(
      testAttendance(checkedOut: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    expect(platform.stopCalls, 1);
    expect(controller.hasServerAuthorizedSession, isFalse);
    expect(controller.status.state, TrackingState.stopped);
  });

  test('latest authoritative state wins concurrent reconciliation', () async {
    final platform = DelayedStopTrackingPlatform();
    final controller = TrackingController(platform: platform);
    final staleReconcile = controller.reconcile(
      testAttendance(),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    await controller.reconcile(
      testAttendance(checkedIn: true),
      apiBaseUrl: 'https://qa.test',
      accessToken: 'token',
    );
    platform.stopGate.complete();
    await staleReconcile;
    expect(platform.stopCalls, 1);
    expect(platform.startCalls, 1);
    expect(controller.hasServerAuthorizedSession, isTrue);
    expect(controller.status.state, TrackingState.active);
  });
}
