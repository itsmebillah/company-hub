import 'package:flutter/services.dart';

enum SoundEvent { success, error, notification }

/// Best-effort, non-blocking feedback sounds. Android/user audio settings remain authoritative.
class SoundService {
  SoundService._();
  static SoundEvent? _lastEvent;
  static DateTime? _lastPlayedAt;

  static Future<void> play(SoundEvent event) async {
    final now = DateTime.now();
    if (_lastEvent == event &&
        _lastPlayedAt != null &&
        now.difference(_lastPlayedAt!) < const Duration(milliseconds: 700)) {
      return;
    }
    _lastEvent = event;
    _lastPlayedAt = now;
    try {
      await SystemSound.play(SystemSoundType.alert);
    } catch (_) {}
  }
}
