import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_environment.dart';
import 'update_service.dart';

class UpdateController extends ChangeNotifier {
  UpdateController({
    required AppEnvironment environment,
    required this.service,
    FlutterSecureStorage? storage,
  }) : _enabled = environment.flavor == AppFlavor.production,
       _storage = storage ?? const FlutterSecureStorage();

  static const _dismissedVersionKey = 'production_update_dismissed_version';

  final bool _enabled;
  final GitHubReleaseUpdateService service;
  final FlutterSecureStorage _storage;

  AvailableUpdate? available;
  bool checking = false;
  bool installing = false;
  String? errorMessage;

  bool get shouldShow => _enabled && available != null;

  Future<void> check() async {
    if (!_enabled || checking || installing) return;
    checking = true;
    notifyListeners();
    try {
      final detected = await service.check();
      final dismissed = int.tryParse(
        await _storage.read(key: _dismissedVersionKey) ?? '',
      );
      available = dismissed == detected?.versionCode ? null : detected;
      errorMessage = null;
    } catch (_) {
      // Update availability must never interrupt normal app use. Preserve any
      // update already found during this app session, but never use stale disk
      // state in place of a fresh GitHub check.
    } finally {
      checking = false;
      notifyListeners();
    }
  }

  Future<void> later() async {
    final update = available;
    if (update != null) {
      await _storage.write(
        key: _dismissedVersionKey,
        value: update.versionCode.toString(),
      );
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
