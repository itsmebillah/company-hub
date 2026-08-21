import 'package:employee_android/src/models/api_error.dart';
import 'package:employee_android/src/models/attendance_state.dart';
import 'package:employee_android/src/models/auth_session.dart';
import 'package:employee_android/src/repositories/attendance_repository.dart';
import 'package:employee_android/src/repositories/auth_repository.dart';
import 'package:employee_android/src/storage/session_storage.dart';

AuthSession testSession({
  String accessToken = 'access-a',
  String refreshToken = 'refresh-a',
}) => AuthSession(
  accessToken: accessToken,
  refreshToken: refreshToken,
  expiresAt: DateTime.utc(2026, 8, 21, 12),
  profile: const SessionProfile(
    employeeId: 'QA-001',
    name: 'QA Employee',
    companyId: 'company-a',
    roleName: 'Employee',
  ),
);

AttendanceState testAttendance({
  bool checkedIn = false,
  bool checkedOut = false,
}) => AttendanceState(
  attendanceDate: '2026-08-21',
  attendance: checkedIn || checkedOut
      ? AttendanceRecord(
          id: 'attendance-a',
          attendanceDate: '2026-08-21',
          checkIn: '2026-08-21T09:00:00Z',
          checkOut: checkedOut ? '2026-08-21T17:00:00Z' : null,
          status: 'present',
          workingMinutes: checkedOut ? 480 : 0,
        )
      : null,
  tracking: TrackingSessionState(
    status: checkedOut
        ? 'completed'
        : checkedIn
        ? 'active'
        : 'inactive',
    sessionId: checkedIn || checkedOut ? 'tracking-a' : null,
  ),
);

class MemorySessionStorage implements SessionStorage {
  AuthSession? value;
  int writes = 0;
  int clears = 0;

  @override
  Future<void> clear() async {
    clears += 1;
    value = null;
  }

  @override
  Future<AuthSession?> read() async => value;

  @override
  Future<void> write(AuthSession session) async {
    writes += 1;
    value = session;
  }
}

class FakeAuthRepository implements AuthRepository {
  AuthSession loginResult = testSession();
  AuthSession refreshResult = testSession(
    accessToken: 'access-b',
    refreshToken: 'refresh-b',
  );
  ApiException? loginError;
  ApiException? refreshError;
  ApiException? logoutError;
  int loginCalls = 0;
  int refreshCalls = 0;
  int logoutCalls = 0;

  @override
  Future<AuthSession> login({
    required String employeeId,
    required String password,
  }) async {
    loginCalls += 1;
    if (loginError case final error?) throw error;
    return loginResult;
  }

  @override
  Future<AuthSession> refresh(String refreshToken) async {
    refreshCalls += 1;
    if (refreshError case final error?) throw error;
    return refreshResult;
  }

  @override
  Future<void> logout(String accessToken) async {
    logoutCalls += 1;
    if (logoutError case final error?) throw error;
  }
}

class FakeAttendanceRepository implements AttendanceRepository {
  AttendanceState state = testAttendance();
  ApiException? stateError;
  ApiException? checkInError;
  ApiException? checkOutError;
  int stateCalls = 0;
  int checkInCalls = 0;
  int checkOutCalls = 0;

  @override
  Future<AttendanceState> getState(String accessToken) async {
    stateCalls += 1;
    if (stateError case final error?) throw error;
    return state;
  }

  @override
  Future<AttendanceState> checkIn(String accessToken) async {
    checkInCalls += 1;
    if (checkInError case final error?) throw error;
    state = testAttendance(checkedIn: true);
    return state;
  }

  @override
  Future<AttendanceState> checkOut(String accessToken) async {
    checkOutCalls += 1;
    if (checkOutError case final error?) throw error;
    state = testAttendance(checkedOut: true);
    return state;
  }
}
