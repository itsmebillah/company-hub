import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

abstract interface class ResourcePinStorage {
  Future<Set<String>> read(String employeeId);
  Future<void> write(String employeeId, Set<String> ids);
}

class SecureResourcePinStorage implements ResourcePinStorage {
  SecureResourcePinStorage({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  String _key(String employeeId) =>
      'companyhub.resource_pins.${base64Url.encode(utf8.encode(employeeId))}';

  @override
  Future<Set<String>> read(String employeeId) async {
    try {
      final raw = await _storage.read(key: _key(employeeId));
      if (raw == null || raw.isEmpty) return <String>{};
      final decoded = jsonDecode(raw);
      if (decoded is! List) return <String>{};
      return decoded.whereType<String>().toSet();
    } catch (_) {
      return <String>{};
    }
  }

  @override
  Future<void> write(String employeeId, Set<String> ids) async {
    try {
      await _storage.write(
        key: _key(employeeId),
        value: jsonEncode(ids.toList()),
      );
    } catch (_) {
      // Pinning remains best-effort if secure storage is unavailable.
    }
  }
}
