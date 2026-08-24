import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_environment.dart';
import 'update_service.dart';

class UpdateController extends ChangeNotifier {
  UpdateController({
    required AppEnvironment environment,
    required this.service,
    FlutterSecureStorage? storage,
    DateTime Function()? now,
  }) : _enabled = environment.flavor == AppFlavor.production,
       _storage = storage ?? const FlutterSecureStorage(),
       _now = now ?? DateTime.now;

  static const _lastCheckedKey = 'production_update_last_checked_at';
  static const _cachedUpdateKey = 'production_update_cached_metadata';
  static const _dismissedVersionKey = 'production_update_dismissed_version';
  static const checkInterval = Duration(hours: 6);

  final bool _enabled;
  final GitHubReleaseUpdateService service;
  final FlutterSecureStorage _storage;
  final DateTime Function() _now;

  AvailableUpdate? available;
  bool checking = false;
  bool installing = false;
  String? errorMessage;

  bool get shouldShow => _enabled && available != null;

  Future<void> check({bool force = false}) async {
    if (!_enabled || checking || installing) return;
    checking = true;
    notifyListeners();
    try {
      final lastRaw = await _storage.read(key: _lastCheckedKey);
      final last = lastRaw == null ? null : DateTime.tryParse(lastRaw);
      if (!force && last != null && _now().difference(last) < checkInterval) {
        available = await _readCachedUpdate();
      } else {
        available = await service.check();
        await _storage.write(
          key: _lastCheckedKey,
          value: _now().toUtc().toIso8601String(),
        );
        await _writeCachedUpdate(available);
      }
      final dismissed = int.tryParse(
        await _storage.read(key: _dismissedVersionKey) ?? '',
      );
      if (dismissed == available?.versionCode) available = null;
      errorMessage = null;
    } catch (_) {
      // Update availability must never interrupt normal app use.
      available = await _readCachedUpdate();
    } finally {
      checking = false;
      notifyListeners();
    }
  }

  Future<void> later() async {
    final update = available;
    if (update != null) {
      await _storage.write(key: _dismissedVersionKey, value: '');
    }
    available = null;
    errorMessage = null;
    notifyListeners();
  }

  Future<void> updateNow() async {
    final update = available;
    if (update == null || installing) return;
    installing = true;
    errorMessage = null;
    notifyListeners();
    final result = await service.install(update);
    if (!result.ok) errorMessage = _messageFor(result.code);
    installing = false;
    notifyListeners();
  }

  Future<AvailableUpdate?> _readCachedUpdate() async {
    try {
      final raw = await _storage.read(key: _cachedUpdateKey);
      final value = raw == null ? null : jsonDecode(raw);
      if (value is! Map<String, dynamic>) return null;
      final url = Uri.tryParse(value['apkUrl'] as String? ?? '');
      final versionName = value['versionName'];
      final versionCode = value['versionCode'];
      final sha256 = value['sha256'];
      if (url == null ||
          !GitHubReleaseUpdateService.isOfficialAssetUrl(
            url,
            GitHubReleaseUpdateService.apkAssetName,
          ) ||
          versionName is! String ||
          versionCode is! int ||
          sha256 is! String ||
          !RegExp(r'^[a-f0-9]{64}$').hasMatch(sha256)) {
        return null;
      }
      return AvailableUpdate(
        versionName: versionName,
        versionCode: versionCode,
        apkUrl: url,
        sha256: sha256,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeCachedUpdate(AvailableUpdate? update) async {
    if (update == null) {
      await _storage.delete(key: _cachedUpdateKey);
      return;
    }
    await _storage.write(
      key: _cachedUpdateKey,
      value: jsonEncode({
        'versionName': update.versionName,
        'versionCode': update.versionCode,
        'apkUrl': update.apkUrl.toString(),
        'sha256': update.sha256,
      }),
    );
  }

  String _messageFor(String? code) => switch (code) {
    'install_permission_required' => 'Allow Company Hub to install this verified update in Android Settings, then tap Update Now again.',
    'download_failed' =>
      'The update download failed. Check your connection and try again later.',
    'hash_mismatch' ||
    'signature_mismatch' ||
    'package_mismatch' ||
    'version_mismatch' =>
      'The downloaded update could not be verified and was not opened.',
    _ => 'The update could not be opened. You can continue using Company Hub and try again later.',
  };
}
