import 'package:employee_android/src/app.dart';
import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

AppEnvironment environment() => AppEnvironment.fromValues(
  flavor: 'qa',
  apiBaseUrl: AppEnvironment.qaApiBaseUrl,
  supabaseUrl: AppEnvironment.qaSupabaseUrl,
  supabaseAnonKey: 'qa-public-anon-placeholder',
);

void main() {
  testWidgets('renders login and safe validation states', (tester) async {
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: MemorySessionStorage(),
    );
    await tester.pumpWidget(
      CompanyHubEmployeeApp(environment: environment(), controller: controller),
    );
    await tester.pumpAndSettle();
    expect(find.text('Employee sign in'), findsOneWidget);
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    expect(find.text('Employee ID is required.'), findsOneWidget);
    expect(find.text('Password is required.'), findsOneWidget);
  });

  testWidgets('login displays authoritative attendance actions', (
    tester,
  ) async {
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: MemorySessionStorage(),
    );
    await tester.pumpWidget(
      CompanyHubEmployeeApp(environment: environment(), controller: controller),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('employeeIdField')), 'QA-001');
    await tester.enterText(find.byKey(const Key('passwordField')), 'password');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
    expect(find.text('QA Employee'), findsOneWidget);
    expect(find.byKey(const Key('checkInButton')), findsOneWidget);
    expect(find.byKey(const Key('logoutButton')), findsOneWidget);
  });
}
