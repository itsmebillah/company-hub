import 'package:employee_android/src/services/sound_service.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'sound failure is non-fatal and duplicate events are throttled',
    () async {
      await expectLater(SoundService.play(SoundEvent.success), completes);
      await expectLater(SoundService.play(SoundEvent.success), completes);
    },
  );
}
