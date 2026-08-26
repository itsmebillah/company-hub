import 'package:employee_android/src/app.dart';
import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:employee_android/src/models/api_error.dart';
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

String expectedLocalTime(String value) {
  final local = DateTime.parse(value).toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final period = local.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
}

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
    expect(find.text("Today's Attendance"), findsOneWidget);
    await tester.tap(find.byKey(const Key('attendanceDestination')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('checkInButton')), findsOneWidget);
    expect(find.byKey(const Key('logoutButton')), findsOneWidget);
  });

  testWidgets('home header uses the mobile dashboard profile response', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      dashboardRepository: FakeDashboardRepository(),
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
    expect(find.byKey(const Key('homeDashboardHeader')), findsOneWidget);
    expect(find.byKey(const Key('homeProfilePhotoFallback')), findsOneWidget);
    expect(find.text('Employee Workspace'), findsOneWidget);
    expect(find.text('Welcome, QA Employee'), findsOneWidget);
    expect(find.text('Company Hub QA'), findsOneWidget);
    expect(find.text('Employee'), findsWidgets);
    expect(find.text('ID QA-001'), findsOneWidget);
    expect(find.byKey(const Key('homeCurrentDate')), findsOneWidget);
  });

  testWidgets('home attendance summary shows not-started state', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: FakeAttendanceRepository(),
      dashboardRepository: FakeDashboardRepository(),
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

    expect(find.text("Today's Attendance"), findsOneWidget);
    expect(find.text('Manual check-in status'), findsOneWidget);
    expect(find.byKey(const Key('homeAttendanceStatus')), findsOneWidget);
    expect(find.text('Not started'), findsOneWidget);
    expect(find.text('Attendance date: 2026-08-21'), findsOneWidget);
    expect(find.text('Check-in'), findsOneWidget);
    expect(find.text('Check-out'), findsOneWidget);
    expect(find.text('Hours'), findsOneWidget);
    expect(find.text('--'), findsNWidgets(3));
    expect(find.byKey(const Key('openAttendanceButton')), findsOneWidget);
  });

  testWidgets('home attendance summary shows active check-in details', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final attendance = FakeAttendanceRepository()
      ..state = testAttendance(checkedIn: true);
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: attendance,
      dashboardRepository: FakeDashboardRepository(),
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

    expect(find.text('Checked in'), findsOneWidget);
    expect(
      find.text(expectedLocalTime('2026-08-21T09:00:00Z')),
      findsOneWidget,
    );
    expect(find.byKey(const Key('homeAttendanceCheckOut')), findsOneWidget);
    expect(find.text('--'), findsNWidgets(2));
  });

  testWidgets('home attendance summary shows checked-out working hours', (
    tester,
  ) async {
    final location = FakeTrackingPlatform();
    final attendance = FakeAttendanceRepository()
      ..state = testAttendance(checkedOut: true);
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: attendance,
      dashboardRepository: FakeDashboardRepository(),
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

    expect(find.text('Checked out'), findsOneWidget);
    expect(
      find.text(expectedLocalTime('2026-08-21T09:00:00Z')),
      findsOneWidget,
    );
    expect(
      find.text(expectedLocalTime('2026-08-21T17:00:00Z')),
      findsOneWidget,
    );
    expect(find.text('8h 0m'), findsOneWidget);
  });

  testWidgets('home attendance summary shows safe error state', (tester) async {
    final location = FakeTrackingPlatform();
    final attendance = FakeAttendanceRepository()
      ..stateError = const ApiException(
        code: 'offline',
        message: 'Attendance is temporarily unavailable.',
      );
    final controller = SessionController(
      authRepository: FakeAuthRepository(),
      attendanceRepository: attendance,
      dashboardRepository: FakeDashboardRepository(),
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

    expect(find.text('Not started'), findsOneWidget);
    expect(find.byKey(const Key('homeAttendanceError')), findsOneWidget);
    expect(find.text('Attendance is temporarily unavailable.'), findsOneWidget);
    expect(find.byKey(const Key('openAttendanceButton')), findsOneWidget);
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
