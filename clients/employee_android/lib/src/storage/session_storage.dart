import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth_session.dart';

abstract interface class SessionStorage {
  Future<AuthSession?> read();
  Future<void> write(AuthSession session);
  Future<void> clear();
}

class SecureSessionStorage implements SessionStorage {
  SecureSessionStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  static const _sessionKey = 'company_hub_mobile_session_v1';
  final FlutterSecureStorage _storage;

  @override
  Future<AuthSession?> read() async {
    final value = await _storage.read(
      key: _sessionKey,
      aOptions: const AndroidOptions(),
    );
    if (value == null) return null;
    try {
      return AuthSession.fromJson(jsonDecode(value) as Map<String, Object?>);
    } catch (_) {
      await clear();
      return null;
    }
  }

  @override
  Future<void> write(AuthSession session) => _storage.write(
    key: _sessionKey,
    value: jsonEncode(session.toJson()),
    aOptions: const AndroidOptions(),
  );

  @override
  Future<void> clear() =>
      _storage.delete(key: _sessionKey, aOptions: const AndroidOptions());
}
