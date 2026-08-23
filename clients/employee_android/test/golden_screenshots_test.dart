import 'dart:ui';

import 'package:employee_android/src/app.dart';
import 'package:employee_android/src/config/app_environment.dart';
import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:employee_android/src/tracking/tracking_controller.dart';
import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

final _environment = AppEnvironment.fromValues(
  flavor: 'qa',
  apiBaseUrl: AppEnvironment.qaApiBaseUrl,
  supabaseUrl: AppEnvironment.qaSupabaseUrl,
  supabaseAnonKey: 'qa-public-anon-placeholder',
);

SessionController _controller(
  MemorySessionStorage storage, {
  FakeAttendanceRepository? attendance,
}) => SessionController(
  authRepository: FakeAuthRepository(),
  attendanceRepository: attendance ?? FakeAttendanceRepository(),
  storage: storage,
);

class _GoldenTrackingPlatform implements TrackingPlatform {
  const _GoldenTrackingPlatform({this.status = denied});

  static const denied = TrackingStatus(
    state: TrackingState.permissionRequired,
    reason: 'precise_location_required',
  );
  final TrackingStatus status;

  @override
  Future<TrackingStatus> getTrackingState() async => status;

  @override
  Future<TrackingStatus> requestRequiredPermissions() async => denied;

  @override
  Future<TrackingStatus> retryPending() async => denied;

  @override
  Future<TrackingStatus> startTracking({
    required String trackingSessionId,
    required bool serverAuthorized,
    required String apiBaseUrl,
    required String accessToken,
  }) async => status;

  @override
  Future<TrackingStatus> stopTracking() async =>
      const TrackingStatus(state: TrackingState.stopped);
}

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

  testWidgets('QA tracking permission disclosure screenshot', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final storage = MemorySessionStorage()..value = testSession();
    final attendance = FakeAttendanceRepository()
      ..state = testAttendance(checkedIn: true);
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: _environment,
        controller: _controller(storage, attendance: attendance),
        trackingController: TrackingController(
          platform: _GoldenTrackingPlatform(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(CompanyHubEmployeeApp),
      matchesGoldenFile('goldens/flutter-tracking-permission-qa.png'),
    );
  });

  testWidgets('QA active native observation disclosure screenshot', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final storage = MemorySessionStorage()..value = testSession();
    final attendance = FakeAttendanceRepository()
      ..state = testAttendance(checkedIn: true);
    await tester.pumpWidget(
      CompanyHubEmployeeApp(
        environment: _environment,
        controller: _controller(storage, attendance: attendance),
        trackingController: TrackingController(
          platform: const _GoldenTrackingPlatform(
            status: TrackingStatus(state: TrackingState.active),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(CompanyHubEmployeeApp),
      matchesGoldenFile('goldens/flutter-location-observation-active-qa.png'),
    );
  });
}
