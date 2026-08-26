import 'package:employee_android/src/platform/external_link_platform.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel(
    'io.github.itsmebillah.companyhub.employee/external-links',
  );

  tearDown(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });

  test(
    'external link platform opens only normalized HTTP destinations',
    () async {
      MethodCall? received;
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, (call) async {
            received = call;
            return true;
          });
      const platform = MethodChannelExternalLinkPlatform();

      expect(await platform.open(' https://example.com/tool '), isTrue);
      expect(received?.method, 'open');
      expect(received?.arguments, {'url': 'https://example.com/tool'});
      received = null;
      expect(await platform.open('javascript:alert(1)'), isFalse);
      expect(received, isNull);
    },
  );

  test('external link failure remains non-fatal', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          channel,
          (_) async => throw PlatformException(code: 'unavailable'),
        );
    const platform = MethodChannelExternalLinkPlatform();
    expect(await platform.open('https://example.com'), isFalse);
  });
}
