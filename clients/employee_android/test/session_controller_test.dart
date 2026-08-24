import 'package:employee_android/src/controllers/session_controller.dart';
import 'package:employee_android/src/models/api_error.dart';
import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter_test/flutter_test.dart';

import 'helpers/fakes.dart';

SessionController harness(
  FakeAuthRepository auth,
  FakeAttendanceRepository attendance,
  MemorySessionStorage storage, [
  FakeTrackingPlatform? location,
]) => SessionController(
  authRepository: auth,
  attendanceRepository: attendance,
  storage: storage,
  locationPlatform: location ?? FakeTrackingPlatform(),
);

void main() {
  test('starts signed out without persisted credentials', () async {
    final controller = harness(
      FakeAuthRepository(),
      FakeAttendanceRepository(),
      MemorySessionStorage(),
    );
    await controller.initialize();
    expect(controller.phase, SessionPhase.signedOut);
  });

  test('valid login persists session and reconciles attendance', () async {
    final auth = FakeAuthRepository();
    final attendance = FakeAttendanceRepository();
    final storage = MemorySessionStorage();
    final controller = harness(auth, attendance, storage)
      ..session = testSession();
    await controller.signIn('QA-001', 'password');
    expect(controller.phase, SessionPhase.authenticated);
    expect(storage.value?.accessToken, 'access-a');
    expect(attendance.stateCalls, 1);
  });

  test('invalid or inactive login returns safely signed out', () async {
    for (final code in ['invalid_credentials', 'active_employee_required']) {
      final auth = FakeAuthRepository()
        ..loginError = ApiException(
          statusCode: 401,
          code: code,
          message: 'Unable to sign in.',
        );
      final controller = harness(
        auth,
        FakeAttendanceRepository(),
        MemorySessionStorage(),
      );
      await controller.signIn('QA-001', 'wrong');
      expect(controller.session, isNull);
      expect(controller.phase, SessionPhase.sessionExpired);
      expect(controller.errorMessage, 'Unable to sign in.');
    }
  });

  test('persisted token refreshes and reconciles on startup', () async {
    final auth = FakeAuthRepository();
    final attendance = FakeAttendanceRepository();
    final storage = MemorySessionStorage()..value = testSession();
    final controller = harness(auth, attendance, storage);
    await controller.initialize();
    expect(auth.refreshCalls, 1);
    expect(storage.value?.accessToken, 'access-b');
    expect(attendance.stateCalls, 1);
  });

  test('refresh failure clears persisted credentials', () async {
    final auth = FakeAuthRepository()
      ..refreshError = const ApiException(
        statusCode: 401,
        code: 'session_expired',
        message: 'Sign in again.',
      );
    final storage = MemorySessionStorage()..value = testSession();
    final controller = harness(auth, FakeAttendanceRepository(), storage);
    await controller.initialize();
    expect(controller.session, isNull);
    expect(storage.value, isNull);
    expect(controller.phase, SessionPhase.sessionExpired);
  });

  test('one 401 refreshes once and retries without a loop', () async {
    final auth = FakeAuthRepository();
    final attendance = FakeAttendanceRepository()
      ..stateError = const ApiException(
        statusCode: 401,
        code: 'session_expired',
        message: 'Expired.',
      );
    final storage = MemorySessionStorage()..value = testSession();
    final controller = harness(auth, attendance, storage)
      ..session = testSession();
    await controller.reconcile();
    expect(auth.refreshCalls, 1);
    expect(attendance.stateCalls, 2);
    expect(controller.session, isNull);
  });

  test('check-in and checkout always reconcile authoritative state', () async {
    final attendance = FakeAttendanceRepository();
    final storage = MemorySessionStorage()..value = testSession();
    final controller = harness(FakeAuthRepository(), attendance, storage)
      ..session = testSession();
    await controller.reconcile();
    await controller.checkIn();
    expect(controller.attendance?.canCheckOut, isTrue);
    await controller.checkOut();
    expect(controller.attendance?.attendance?.isCheckedOut, isTrue);
    expect(attendance.stateCalls, 3);
  });

  test(
    'check-in and checkout submit a fresh GPS fix at policy accuracy',
    () async {
      final attendance = FakeAttendanceRepository();
      final location = FakeTrackingPlatform();
      final controller = harness(
        FakeAuthRepository(),
        attendance,
        MemorySessionStorage()..value = testSession(),
        location,
      )..session = testSession();
      await controller.reconcile();
      await controller.checkIn();
      await controller.checkOut();
      expect(location.positionCalls, 2);
      expect(location.requestedAccuracy, 50);
      expect(attendance.checkInGps?.accuracy, 12);
      expect(attendance.checkOutGps?.accuracy, 12);
    },
  );

  test('poor accuracy blocks the mutation without weakening policy', () async {
    final attendance = FakeAttendanceRepository();
    final location = FakeTrackingPlatform()
      ..position = const AttendanceGps(
        latitude: 23.7806,
        longitude: 90.4070,
        accuracy: 80,
        timestamp: '2026-08-21T09:00:00.000Z',
      );
    final controller = harness(
      FakeAuthRepository(),
      attendance,
      MemorySessionStorage()..value = testSession(),
      location,
    )..session = testSession();
    await controller.reconcile();
    await controller.checkIn();
    expect(attendance.checkInCalls, 0);
    expect(controller.errorMessage, contains('50m or better'));
  });

  test(
    'location failure is user-friendly and never calls attendance API',
    () async {
      final attendance = FakeAttendanceRepository();
      final location = FakeTrackingPlatform()
        ..positionError = const AttendanceLocationException(
          'location_services_disabled',
        );
      final controller = harness(
        FakeAuthRepository(),
        attendance,
        MemorySessionStorage()..value = testSession(),
        location,
      )..session = testSession();
      await controller.reconcile();
      await controller.checkIn();
      expect(attendance.checkInCalls, 0);
      expect(controller.errorMessage, contains('Turn on Android Location'));
    },
  );
  test('ambiguous checkout reconciles instead of claiming success', () async {
    final attendance = FakeAttendanceRepository()
      ..state = testAttendance(checkedOut: true)
      ..checkOutError = const ApiException(
        code: 'network_timeout',
        message: 'Timed out.',
        outcomeAmbiguous: true,
      );
    final storage = MemorySessionStorage()..value = testSession();
    final controller = harness(FakeAuthRepository(), attendance, storage)
      ..session = testSession();
    await controller.checkOut();
    expect(attendance.stateCalls, 1);
    expect(controller.attendance?.attendance?.isCheckedOut, isTrue);
  });

  test(
    'attendance mutation error remains visible after reconciliation',
    () async {
      final attendance = FakeAttendanceRepository()
        ..checkInError = const ApiException(
          statusCode: 503,
          code: 'temporarily_unavailable',
          message: 'Attendance is temporarily unavailable.',
        );
      final storage = MemorySessionStorage()..value = testSession();
      final controller = harness(FakeAuthRepository(), attendance, storage)
        ..session = testSession();
      await controller.checkIn();
      expect(attendance.stateCalls, 1);
      expect(controller.attendance?.canCheckIn, isTrue);
      expect(controller.errorMessage, 'Attendance is temporarily unavailable.');
    },
  );

  test(
    'logout clears local session even when revocation is unavailable',
    () async {
      final auth = FakeAuthRepository()
        ..logoutError = const ApiException(
          code: 'network_unavailable',
          message: 'Offline.',
        );
      final storage = MemorySessionStorage()..value = testSession();
      final controller = harness(auth, FakeAttendanceRepository(), storage)
        ..session = testSession();
      await controller.signOut();
      expect(auth.logoutCalls, 1);
      expect(storage.value, isNull);
      expect(controller.phase, SessionPhase.signedOut);
    },
  );
}
