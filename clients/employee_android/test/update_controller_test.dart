import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/updates/update_controller.dart';
import 'package:employee_android/src/updates/update_platform.dart';
import 'package:employee_android/src/updates/update_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => FlutterSecureStorage.setMockInitialValues({}));

  test('a negative result is not cached and the next check is fresh', () async {
    FlutterSecureStorage.setMockInitialValues({
      'production_update_last_checked_at': DateTime.now().toIso8601String(),
    });
    final service = _FakeUpdateService([null, _version3]);
    final controller = _controller(service);

    await controller.check();
    expect(controller.available, isNull);
    expect(service.checkCalls, 1);

    await controller.check();
    expect(service.checkCalls, 2);
    expect(controller.available?.versionCode, 3);
  });

  test('Later suppresses only that release and not a newer one', () async {
    final service = _FakeUpdateService([_version3, _version3, _version4]);
    final controller = _controller(service);

    await controller.check();
    await controller.later();
    expect(controller.available, isNull);

    await controller.check();
    expect(service.checkCalls, 2);
    expect(controller.available, isNull);

    await controller.check();
    expect(service.checkCalls, 3);
    expect(controller.available?.versionCode, 4);
  });

  test('an offline failure is safe and preserves session state', () async {
    final service = _FakeUpdateService([
      _version3,
      const FormatException('offline'),
    ]);
    final controller = _controller(service);

    await controller.check();
    await controller.check();

    expect(service.checkCalls, 2);
    expect(controller.available?.versionCode, 3);
    expect(controller.checking, isFalse);
  });

  test('QA keeps the Production update checker disabled', () async {
    final service = _FakeUpdateService([_version3]);
    final controller = UpdateController(
      environment: _environment('qa'),
      service: service,
    );

    await controller.check();

    expect(service.checkCalls, 0);
    expect(controller.available, isNull);
  });
}

UpdateController _controller(GitHubReleaseUpdateService service) =>
    UpdateController(environment: _environment('production'), service: service);

AppEnvironment _environment(String flavor) => AppEnvironment.fromValues(
  flavor: flavor,
  apiBaseUrl: flavor == 'production'
      ? 'https://company-hub-zeta.vercel.app'
      : 'https://company-hub-qa.onrender.com',
  supabaseUrl: flavor == 'production'
      ? 'https://jjfktbgfwvekhlvyjlww.supabase.co'
      : 'https://qa-project.supabase.co',
  supabaseAnonKey: 'public-anon-test-placeholder',
);

AvailableUpdate _update(String versionName, int versionCode) => AvailableUpdate(
  versionName: versionName,
  versionCode: versionCode,
  apkUrl: Uri.parse(
    'https://github.com/itsmebillah/company-hub/releases/download/'
    'v$versionName/app-production-release.apk',
  ),
  sha256: 'a' * 64,
);

final _version3 = _update('0.1.2', 3);
final _version4 = _update('0.1.3', 4);

class _FakeUpdateService extends GitHubReleaseUpdateService {
  _FakeUpdateService(this._results)
    : super(platform: MethodChannelUpdatePlatform());

  final List<Object?> _results;
  int checkCalls = 0;

  @override
  Future<AvailableUpdate?> check() async {
    final result = _results[checkCalls++];
    if (result is Exception) throw result;
    return result as AvailableUpdate?;
  }

  @override
  Future<UpdateInstallResult> install(AvailableUpdate update) async =>
      const UpdateInstallResult(ok: true);
}
