import 'package:employee_android/src/app.dart';
import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:employee_android/src/tracking/tracking_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

AppEnvironment environment() => AppEnvironment.fromValues(
  flavor: 'qa',
  apiBaseUrl: 'https://company-hub-qa.onrender.com',
  supabaseUrl: 'https://qa-project.supabase.co',
  supabaseAnonKey: 'qa-public-anon-placeholder',
);

void main() {
  testWidgets('renders login and safe validation states', (tester) async {
    final location = FakeTrackingPlatform();
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: MemorySessionStorage(),
      locationPlatform: location,
    );
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: environment(),
        controller: controller,
        trackingController: TrackingController(platform: location),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Employee sign in'), findsOneWidget);
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    expect(find.text('Employee ID is required.'), findsOneWidget);
    expect(find.text('Password is required.'), findsOneWidget);
  });

  testWidgets('login opens dashboard and preserves attendance navigation', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: MemorySessionStorage(),
      locationPlatform: location,
    );
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: environment(),
        controller: controller,
        trackingController: TrackingController(platform: location),
      ),
    );
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('employeeIdField')), 'QA-001');
    await tester.enterText(find.byKey(const Key('passwordField')), 'password');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pumpAndSettle();
    expect(find.text('Welcome, QA Employee'), findsOneWidget);
    expect(find.byKey(const Key('homeScreen')), findsOneWidget);
    expect(find.text("Today's attendance"), findsOneWidget);
    await tester.tap(find.byKey(const Key('attendanceDestination')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('checkInButton')), findsOneWidget);
    expect(find.byKey(const Key('logoutButton')), findsOneWidget);
  });

  testWidgets('profile shows only verified session identity and can sign out', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      storage: MemorySessionStorage()..value = testSession(),
      locationPlatform: location,
    );
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: environment(),
        controller: controller,
        trackingController: TrackingController(platform: location),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('profileDestination')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('profileScreen')), findsOneWidget);
    expect(find.byKey(const Key('profileEmployeeId')), findsOneWidget);
    expect(find.text('QA-001'), findsOneWidget);
    expect(find.text('company-a'), findsNothing);
    await tester.tap(find.byKey(const Key('profileLogoutButton')));
    await tester.pumpAndSettle();
    expect(find.text('Employee sign in'), findsOneWidget);
  });
}
