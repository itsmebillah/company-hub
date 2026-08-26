import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_environment.dart';
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
  GitHubReleaseUpdateService({
    required this.platform,
    required AppEnvironment environment,
    http.Client? client,
  }) : _channel = UpdateReleaseChannel.forFlavor(environment.flavor),
       _client = client ?? http.Client();

  static final latestReleaseUri = Uri.https(
    'api.github.com',
    '/repos/itsmebillah/company-hub/releases/latest',
  );
  static const metadataAssetName = 'company-hub-android.json';
  static const apkAssetName = 'app-production-release.apk';
  static const productionApplicationId =
      'io.github.itsmebillah.companyhub.employee';
  static const qaApplicationId = '$productionApplicationId.qa';

  final UpdatePlatform platform;
  final UpdateReleaseChannel _channel;
  final http.Client _client;

  Future<AvailableUpdate?> check() async {
    final installed = await platform.getInstalledInfo();
    if (installed.applicationId != _channel.applicationId) return null;

    final releaseResponse = await _client
        .get(
          _channel.releaseUri,
          headers: const {
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'CompanyHub-Employee-Android',
          },
        )
        .timeout(const Duration(seconds: 10));
    if (releaseResponse.statusCode != 200) {
      throw const FormatException('release_unavailable');
    }

    final decoded = jsonDecode(releaseResponse.body);
    final release = _channel.selectRelease(decoded);
    if (release == null) return null;
    if (!_channel.acceptsRelease(release)) {
      throw const FormatException('invalid_release');
    }
    final assets = release['assets'];
    if (assets is! List) throw const FormatException('invalid_assets');

    final metadataUrl = _assetUrl(assets, _channel.metadataAssetName);
    final apkUrl = _assetUrl(assets, _channel.apkAssetName);
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
    if (applicationId != _channel.applicationId ||
        channel != _channel.name ||
        versionName is! String ||
        versionName.trim().isEmpty ||
        versionCode is! int ||
        versionCode <= 0 ||
        declaredAsset != _channel.apkAssetName ||
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

class UpdateReleaseChannel {
  const UpdateReleaseChannel._({
    required this.name,
    required this.applicationId,
    required this.releaseUri,
    required this.metadataAssetName,
    required this.apkAssetName,
    required this.tagPrefix,
    required this.requiresPrerelease,
  });

  factory UpdateReleaseChannel.forFlavor(AppFlavor flavor) => switch (flavor) {
    AppFlavor.production => production,
    AppFlavor.qa => qa,
  };

  static final production = UpdateReleaseChannel._(
    name: 'production',
    applicationId: GitHubReleaseUpdateService.productionApplicationId,
    releaseUri: GitHubReleaseUpdateService.latestReleaseUri,
    metadataAssetName: GitHubReleaseUpdateService.metadataAssetName,
    apkAssetName: GitHubReleaseUpdateService.apkAssetName,
    tagPrefix: 'v',
    requiresPrerelease: false,
  );
  static final qa = UpdateReleaseChannel._(
    name: 'qa',
    applicationId: GitHubReleaseUpdateService.qaApplicationId,
    releaseUri: Uri.https(
      'api.github.com',
      '/repos/itsmebillah/company-hub/releases',
      const {'per_page': '20'},
    ),
    metadataAssetName: 'company-hub-android-qa.json',
    apkAssetName: 'app-qa-debug.apk',
    tagPrefix: 'qa-v',
    requiresPrerelease: true,
  );

  final String name;
  final String applicationId;
  final Uri releaseUri;
  final String metadataAssetName;
  final String apkAssetName;
  final String tagPrefix;
  final bool requiresPrerelease;

  Map<String, dynamic>? selectRelease(Object? decoded) {
    if (name == 'production') {
      return decoded is Map<String, dynamic> ? decoded : null;
    }
    if (decoded is! List) throw const FormatException('invalid_release_list');
    for (final item in decoded) {
      if (item is Map<String, dynamic> && acceptsRelease(item)) return item;
    }
    return null;
  }

  bool acceptsRelease(Map<String, dynamic> release) {
    final tag = release['tag_name'];
    return release['draft'] != true &&
        release['prerelease'] == requiresPrerelease &&
        tag is String &&
        tag.startsWith(tagPrefix);
  }
}
