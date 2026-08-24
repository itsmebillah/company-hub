import 'dart:convert';

import 'package:http/http.dart' as http;

import 'update_platform.dart';

class AvailableUpdate {
  const AvailableUpdate({
    required this.versionName,
    required this.versionCode,
    required this.apkUrl,
    required this.sha256,
  });

  final String versionName;
  final int versionCode;
  final Uri apkUrl;
  final String sha256;
}

class GitHubReleaseUpdateService {
  GitHubReleaseUpdateService({required this.platform, http.Client? client})
    : _client = client ?? http.Client();

  static final latestReleaseUri = Uri.https(
    'api.github.com',
    '/repos/itsmebillah/company-hub/releases/latest',
  );
  static const metadataAssetName = 'company-hub-android.json';
  static const apkAssetName = 'app-production-release.apk';
  static const productionApplicationId =
      'io.github.itsmebillah.companyhub.employee';

  final UpdatePlatform platform;
  final http.Client _client;

  Future<AvailableUpdate?> check() async {
    final installed = await platform.getInstalledInfo();
    if (installed.applicationId != productionApplicationId) return null;

    final releaseResponse = await _client
        .get(
          latestReleaseUri,
          headers: const {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'CompanyHub-Employee-Android',
          },
        )
        .timeout(const Duration(seconds: 10));
    if (releaseResponse.statusCode != 200) {
      throw const FormatException('release_unavailable');
    }

    final release = jsonDecode(releaseResponse.body);
    if (release is! Map<String, dynamic> ||
        release['draft'] == true ||
        release['prerelease'] == true) {
      throw const FormatException('invalid_release');
    }
    final assets = release['assets'];
    if (assets is! List) throw const FormatException('invalid_assets');

    final metadataUrl = _assetUrl(assets, metadataAssetName);
    final apkUrl = _assetUrl(assets, apkAssetName);
    final metadataResponse = await _client
        .get(
          metadataUrl,
          headers: const {
            'Accept': 'application/octet-stream',
            'User-Agent': 'CompanyHub-Employee-Android',
          },
        )
        .timeout(const Duration(seconds: 10));
    if (metadataResponse.statusCode != 200) {
      throw const FormatException('metadata_unavailable');
    }

    final value = jsonDecode(metadataResponse.body);
    if (value is! Map<String, dynamic>) {
      throw const FormatException('invalid_metadata');
    }
    final applicationId = value['applicationId'];
    final channel = value['channel'];
    final versionName = value['versionName'];
    final versionCode = value['versionCode'];
    final declaredAsset = value['apkAssetName'];
    final sha256 = value['sha256'];
    if (applicationId != productionApplicationId ||
        channel != 'production' ||
        versionName is! String ||
        versionName.trim().isEmpty ||
        versionCode is! int ||
        versionCode <= 0 ||
        declaredAsset != apkAssetName ||
        sha256 is! String ||
        !RegExp(r'^[a-f0-9]{64}$').hasMatch(sha256)) {
      throw const FormatException('invalid_metadata');
    }
    if (versionCode <= installed.versionCode) return null;
    return AvailableUpdate(
      versionName: versionName,
      versionCode: versionCode,
      apkUrl: apkUrl,
      sha256: sha256,
    );
  }

  Future<UpdateInstallResult> install(AvailableUpdate update) =>
      platform.downloadAndInstall(
        apkUrl: update.apkUrl,
        sha256: update.sha256,
        versionCode: update.versionCode,
      );

  static bool isOfficialAssetUrl(Uri uri, String assetName) {
    final segments = uri.pathSegments;
    return uri.scheme == 'https' &&
        uri.host == 'github.com' &&
        segments.length == 6 &&
        segments[0] == 'itsmebillah' &&
        segments[1] == 'company-hub' &&
        segments[2] == 'releases' &&
        segments[3] == 'download' &&
        segments[4].isNotEmpty &&
        segments[5] == assetName;
  }

  Uri _assetUrl(List<dynamic> assets, String name) {
    for (final item in assets) {
      if (item is! Map<String, dynamic> || item['name'] != name) continue;
      final raw = item['browser_download_url'];
      final uri = raw is String ? Uri.tryParse(raw) : null;
      if (uri == null || !isOfficialAssetUrl(uri, name)) {
        throw const FormatException('untrusted_asset_url');
      }
      return uri;
    }
    throw FormatException('missing_asset:$name');
  }
}
