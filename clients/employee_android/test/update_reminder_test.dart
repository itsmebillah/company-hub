import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/updates/update_controller.dart';
import 'package:employee_android/src/updates/update_platform.dart';
import 'package:employee_android/src/updates/update_reminder.dart';
import 'package:employee_android/src/updates/update_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('reminder is non-blocking and Later dismisses this version', (
    tester,
  ) async {
    final controller = _controller(_FakeUpdatePlatform())
      ..available = _available;
    await tester.pumpWidget(
      MaterialApp(
        home: UpdateReminder(
          controller: controller,
          child: const Scaffold(body: Text('Normal app content')),
        ),
      ),
    );

    expect(find.text('Normal app content'), findsOneWidget);
    expect(find.byKey(const Key('updateReminderTitle')), findsOneWidget);
    await tester.tap(find.byKey(const Key('updateLaterButton')));
    await tester.pumpAndSettle();

    expect(find.byKey(const Key('updateReminderTitle')), findsNothing);
    expect(find.text('Normal app content'), findsOneWidget);
  });

  testWidgets('Update Now delegates to the verified native installer flow', (
    tester,
  ) async {
    final platform = _FakeUpdatePlatform();
    final controller = _controller(platform)..available = _available;
    await tester.pumpWidget(
      MaterialApp(
        home: UpdateReminder(
          controller: controller,
          child: const Scaffold(body: Text('Normal app content')),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('updateNowButton')));
    await tester.pumpAndSettle();

    expect(platform.installCalls, 1);
    expect(platform.requestedVersionCode, _available.versionCode);
    expect(find.text('Normal app content'), findsOneWidget);
  });
}

UpdateController _controller(_FakeUpdatePlatform platform) => UpdateController(
  environment: AppEnvironment.fromValues(
    flavor: 'production',
    apiBaseUrl: 'https://company-hub-zeta.vercel.app',
    supabaseUrl: 'https://jjfktbgfwvekhlvyjlww.supabase.co',
    supabaseAnonKey: 'public-anon-test-placeholder',
  ),
  service: GitHubReleaseUpdateService(platform: platform),
);

final _available = AvailableUpdate(
  versionName: '0.1.1',
  versionCode: 2,
  apkUrl: Uri.parse(
    'https://github.com/itsmebillah/company-hub/releases/download/v0.1.1/'
    'app-production-release.apk',
  ),
  sha256: 'a' * 64,
);

class _FakeUpdatePlatform implements UpdatePlatform {
  int installCalls = 0;
  int? requestedVersionCode;

  @override
  Future<InstalledAppInfo> getInstalledInfo() async => const InstalledAppInfo(
    applicationId: GitHubReleaseUpdateService.productionApplicationId,
    versionName: '0.1.0',
    versionCode: 1,
  );

  @override
  Future<UpdateInstallResult> downloadAndInstall({
    required Uri apkUrl,
    required String sha256,
    required int versionCode,
  }) async {
    installCalls += 1;
    requestedVersionCode = versionCode;
    return const UpdateInstallResult(ok: true);
  }
}
