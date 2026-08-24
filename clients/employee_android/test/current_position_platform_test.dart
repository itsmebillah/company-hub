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

  test('requests and maps a fresh current GPS position', () async {
    MethodCall? received;
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          received = call;
          return <String, Object?>{
            'ok': true,
            'latitude': 23.7806,
            'longitude': 90.407,
            'accuracy': 12.5,
            'timestamp': '2026-08-24T09:00:00.000Z',
            'source': 'gps',
          };
        });

    final position = await MethodChannelTrackingPlatform(channel: channel)
        .getCurrentPosition(
          maxAccuracyMeters: 50,
          timeout: const Duration(seconds: 15),
        );

    expect(received?.method, TrackingChannelContract.getCurrentPosition);
    expect(received?.arguments, {
      'maxAccuracyMeters': 50.0,
      'timeoutMillis': 15000,
    });
    expect(position.accuracy, 12.5);
    expect(position.source, 'gps');
  });

  test('maps native location failures to safe user-facing errors', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (_) async => <String, Object?>{
            'ok': false,
            'code': 'location_services_disabled',
          },
        );

    await expectLater(
      MethodChannelTrackingPlatform(channel: channel)
          .getCurrentPosition(maxAccuracyMeters: 50),
      throwsA(
        isA<AttendanceLocationException>().having(
          (error) => error.code,
          'code',
          'location_services_disabled',
        ),
      ),
    );
  });
}
