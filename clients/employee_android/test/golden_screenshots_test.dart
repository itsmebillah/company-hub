import 'dart:ui';

import 'package:employee_android/src/app.dart';
import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

final _environment = AppEnvironment.fromValues(
  flavor: 'qa',
  apiBaseUrl: AppEnvironment.qaApiBaseUrl,
  supabaseUrl: AppEnvironment.qaSupabaseUrl,
  supabaseAnonKey: 'qa-public-anon-placeholder',
);

SessionController _controller(MemorySessionStorage storage) =>
    SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: storage,
    );

void main() {
  testWidgets('QA login screenshot', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: _environment,
        controller: _controller(MemorySessionStorage()),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(CompanyHubEmployeeApp),
      matchesGoldenFile('goldens/flutter-login-qa.png'),
    );
  });

  testWidgets('QA attendance screenshot', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final storage = MemorySessionStorage()..value = testSession();
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: _environment,
        controller: _controller(storage),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(CompanyHubEmployeeApp),
      matchesGoldenFile('goldens/flutter-attendance-qa.png'),
    );
  });
}
