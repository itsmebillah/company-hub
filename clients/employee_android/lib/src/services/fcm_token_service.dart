import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import '../repositories/notification_device_repository.dart';

abstract interface class PushTokenLifecycle {
  Future<void> initialize(String accessToken);
  Future<void> remove(String accessToken);
}

class FcmTokenService implements PushTokenLifecycle {
  FcmTokenService(this._repository);

  final NotificationDeviceRepository _repository;
  StreamSubscription<String>? _refreshSubscription;
  String? _token;
  String? _accessToken;
  bool _initialized = false;

  @override
  Future<void> initialize(String accessToken) async {
    if (!Platform.isAndroid || accessToken.isEmpty) return;
    _accessToken = accessToken;
    try {
      if (Firebase.apps.isEmpty) await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(alert: true, badge: true, sound: true);
      final token = await messaging.getToken();
      if (token != null) await _register(accessToken, token);
      if (_initialized) {
        return;
      }
      _initialized = true;
      _refreshSubscription = messaging.onTokenRefresh.listen((value) {
        final current = _accessToken;
        if (current != null) unawaited(_register(current, value));
      });
    } catch (_) {
      // Push registration is best-effort and never blocks authentication.
    }
  }

  Future<void> _register(String accessToken, String token) async {
    if (token.isEmpty || (_token == token && _accessToken == accessToken)) {
      return;
    }
    try {
      await _repository.register(accessToken, token);
      _token = token;
      _accessToken = accessToken;
    } catch (_) {
      // A later startup/token refresh retries registration.
    }
  }

  @override
  Future<void> remove(String accessToken) async {
    final token = _token;
    _accessToken = null;
    _token = null;
    if (token == null || accessToken.isEmpty) return;
    try {
      await _repository.remove(accessToken, token);
    } catch (_) {
      // Local logout must succeed even if token deactivation is unavailable.
    }
  }

  Future<void> dispose() async {
    await _refreshSubscription?.cancel();
    _refreshSubscription = null;
    _initialized = false;
  }
}
