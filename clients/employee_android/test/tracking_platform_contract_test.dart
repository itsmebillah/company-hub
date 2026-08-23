import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel(TrackingChannelContract.channelName);

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test('defines every approved tracking state wire value', () {
    expect(
      TrackingState.values.map((state) => state.wireName),
      containsAll(<String>{
        'unavailable',
        'permission_required',
        'permission_denied',
        'notification_required',
        'ready',
        'starting',
        'active',
        'suspended',
        'stopping',
        'stopped',
        'error',
      }),
    );
  });

  test(
    'passes server-authorized session separately from channel state',
    () async {
      MethodCall? received;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, (call) async {
            received = call;
            return <String, Object?>{'state': 'permission_required'};
          });
      final platform = MethodChannelTrackingPlatform(channel: channel);
      final result = await platform.startTracking(
        trackingSessionId: 'tracking-session-a',
        serverAuthorized: true,
        apiBaseUrl: 'https://qa.example.test',
        accessToken: 'short-lived-token',
      );
      expect(received?.method, TrackingChannelContract.startTracking);
      expect(received?.arguments, {
        'trackingSessionId': 'tracking-session-a',
        'serverAuthorized': true,
        'apiBaseUrl': 'https://qa.example.test',
        'accessToken': 'short-lived-token',
      });
      expect(result.state, TrackingState.permissionRequired);
      expect(result.isActive, isFalse);
    },
  );

  test('maps all channel methods without adding location payloads', () async {
    final methods = <String>[];
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          methods.add(call.method);
          return <String, Object?>{'state': 'stopped'};
        });
    final platform = MethodChannelTrackingPlatform(channel: channel);
    await platform.stopTracking();
    await platform.getTrackingState();
    await platform.requestRequiredPermissions();
    await platform.retryPending();
    expect(methods, [
      TrackingChannelContract.stopTracking,
      TrackingChannelContract.getTrackingState,
      TrackingChannelContract.requestRequiredPermissions,
      TrackingChannelContract.retryPending,
    ]);
  });

  test('exposes only redacted native queue health', () {
    final status = TrackingStatus.fromMap(const {
      'state': 'active',
      'pendingPointCount': 7,
      'syncState': 'retry_scheduled',
    });
    expect(status.pendingPointCount, 7);
    expect(status.syncState, 'retry_scheduled');
  });

  test('redacts native platform failures into a stable error', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (_) async {
          throw PlatformException(
            code: 'provider_detail',
            message: 'raw detail',
          );
        });
    final result = await MethodChannelTrackingPlatform(channel: channel)
        .getTrackingState();
    expect(result.state, TrackingState.error);
    expect(result.reason, 'native_tracking_unavailable');
  });
}
