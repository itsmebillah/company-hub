import 'dart:convert';

import 'package:employee_android/src/updates/update_platform.dart';
import 'package:employee_android/src/updates/update_service.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  const installed = InstalledAppInfo(
    applicationId: GitHubReleaseUpdateService.productionApplicationId,
    versionName: '0.1.1',
    versionCode: 2,
  );
  final metadataUrl = Uri.parse(
    'https://github.com/itsmebillah/company-hub/releases/download/v0.1.2/'
    'company-hub-android.json',
  );
  final apkUrl = Uri.parse(
    'https://github.com/itsmebillah/company-hub/releases/download/v0.1.2/'
    'app-production-release.apk',
  );

  String releaseBody({Uri? apk}) => jsonEncode({
    'draft': false,
    'prerelease': false,
    'assets': [
      {
        'name': GitHubReleaseUpdateService.metadataAssetName,
        'browser_download_url': metadataUrl.toString(),
      },
      {
        'name': GitHubReleaseUpdateService.apkAssetName,
        'browser_download_url': (apk ?? apkUrl).toString(),
      },
    ],
  });

  String metadataBody({int versionCode = 3, String? sha256}) => jsonEncode({
    'applicationId': GitHubReleaseUpdateService.productionApplicationId,
    'channel': 'production',
    'versionName': '0.1.2',
    'versionCode': versionCode,
    'apkAssetName': GitHubReleaseUpdateService.apkAssetName,
    'sha256': sha256 ?? 'a' * 64,
  });

  GitHubReleaseUpdateService service(
    _FakeUpdatePlatform platform, {
    Uri? apk,
    int versionCode = 3,
    String? sha256,
  }) {
    return GitHubReleaseUpdateService(
      platform: platform,
      client: MockClient((request) async {
        if (request.url == GitHubReleaseUpdateService.latestReleaseUri) {
          return http.Response(releaseBody(apk: apk), 200);
        }
        if (request.url == metadataUrl) {
          return http.Response(
            metadataBody(versionCode: versionCode, sha256: sha256),
            200,
          );
        }
        return http.Response('', 404);
      }),
    );
  }

  test(
    'returns only a newer production update from official release assets',
    () async {
      final platform = _FakeUpdatePlatform(installed);
      final updater = service(platform);
      final update = await updater.check();

      expect(update?.versionCode, 3);
      expect(update?.apkUrl, apkUrl);
      await updater.install(update!);
      expect(platform.installedVersionCode, 3);
    },
  );

  test('shows nothing when the release version is not newer', () async {
    final update = await service(
      _FakeUpdatePlatform(installed),
      versionCode: 2,
    ).check();

    expect(update, isNull);
  });

  test('rejects an arbitrary APK download origin', () async {
    await expectLater(
      service(
        _FakeUpdatePlatform(installed),
        apk: Uri.parse('https://example.invalid/app-production-release.apk'),
      ).check(),
      throwsA(isA<FormatException>()),
    );
  });

  test('rejects invalid checksum metadata', () async {
    await expectLater(
      service(_FakeUpdatePlatform(installed), sha256: 'not-a-sha').check(),
      throwsA(isA<FormatException>()),
    );
  });
}

class _FakeUpdatePlatform implements UpdatePlatform {
  _FakeUpdatePlatform(this.info);

  final InstalledAppInfo info;
  int? installedVersionCode;

  @override
  Future<InstalledAppInfo> getInstalledInfo() async => info;

  @override
  Future<UpdateInstallResult> downloadAndInstall({
    required Uri apkUrl,
    required String sha256,
    required int versionCode,
  }) async {
    installedVersionCode = versionCode;
    return const UpdateInstallResult(ok: true);
  }
}
