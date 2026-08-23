import 'package:flutter/foundation.dart';

import '../models/api_error.dart';
import '../models/attendance_state.dart';
import '../models/auth_session.dart';
import '../repositories/attendance_repository.dart';
import '../repositories/auth_repository.dart';
import '../storage/session_storage.dart';

enum SessionPhase {
  initializing,
  signedOut,
  signingIn,
  authenticated,
  refreshing,
  reconciling,
  signingOut,
  sessionExpired,
}

class SessionController extends ChangeNotifier {
  SessionController({
    required AuthRepository authRepository,
    required AttendanceRepository attendanceRepository,
    required SessionStorage storage,
  }) : this._(authRepository, attendanceRepository, storage);

  SessionController._(
    this._authRepository,
    this._attendanceRepository,
    this._storage,
  );

  final AuthRepository _authRepository;
  final AttendanceRepository _attendanceRepository;
  final SessionStorage _storage;

  SessionPhase phase = SessionPhase.initializing;
  AuthSession? session;
  AttendanceState? attendance;
  String? errorMessage;

  bool get isBusy => switch (phase) {
    SessionPhase.initializing ||
    SessionPhase.signingIn ||
    SessionPhase.refreshing ||
    SessionPhase.reconciling ||
    SessionPhase.signingOut => true,
    _ => false,
  };

  Future<void> initialize() async {
    session = await _storage.read();
    if (session == null) {
      _setPhase(SessionPhase.signedOut);
      return;
    }
    if (!await _refresh()) return;
    await reconcile();
  }

  Future<void> signIn(String employeeId, String password) async {
    if (employeeId.trim().isEmpty || password.isEmpty) {
      errorMessage = 'Employee ID and password are required.';
      _setPhase(SessionPhase.signedOut);
      return;
    }
    errorMessage = null;
    _setPhase(SessionPhase.signingIn);
    try {
      session = await _authRepository.login(
        employeeId: employeeId.trim(),
        password: password,
      );
      await _storage.write(session!);
      _setPhase(SessionPhase.authenticated);
      await reconcile();
    } on ApiException catch (error) {
      await _clearSession(
        message: error.message,
        expired: error.isUnauthorized,
      );
    }
  }

  Future<bool> _refresh() async {
    final current = session;
    if (current == null) return false;
    _setPhase(SessionPhase.refreshing);
    try {
      session = await _authRepository.refresh(current.refreshToken);
      await _storage.write(session!);
      _setPhase(SessionPhase.authenticated);
      return true;
    } on ApiException catch (error) {
      await _clearSession(message: error.message, expired: true);
      return false;
    }
  }

  Future<T?> _authorized<T>(Future<T> Function(String token) operation) async {
    var current = session;
    if (current == null) return null;
    try {
      return await operation(current.accessToken);
    } on ApiException catch (error) {
      if (!error.isUnauthorized) rethrow;
      if (!await _refresh()) return null;
      current = session;
      if (current == null) return null;
      try {
        return await operation(current.accessToken);
      } on ApiException catch (retryError) {
        if (retryError.isUnauthorized) {
          await _clearSession(message: retryError.message, expired: true);
          return null;
        }
        rethrow;
      }
    }
  }

  Future<void> reconcile() async {
    if (session == null) return;
    errorMessage = null;
    _setPhase(SessionPhase.reconciling);
    try {
      final state = await _authorized(_attendanceRepository.getState);
      if (state == null) return;
      attendance = state;
      _setPhase(SessionPhase.authenticated);
    } on ApiException catch (error) {
      errorMessage = error.message;
      _setPhase(SessionPhase.authenticated);
    }
  }

  Future<void> checkIn() => _mutateAttendance(_attendanceRepository.checkIn);

  Future<void> checkOut() => _mutateAttendance(_attendanceRepository.checkOut);

  Future<void> _mutateAttendance(
    Future<AttendanceState> Function(String token) operation,
  ) async {
    if (session == null) return;
    errorMessage = null;
    String? mutationError;
    _setPhase(SessionPhase.reconciling);
    try {
      await _authorized(operation);
    } on ApiException catch (error) {
      mutationError = error.message;
    }
    if (session != null) await reconcile();
    if (session != null && mutationError != null) {
      errorMessage = mutationError;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    final current = session;
    _setPhase(SessionPhase.signingOut);
    try {
      if (current != null) await _authRepository.logout(current.accessToken);
    } on ApiException {
      // Local credentials are cleared even if remote revocation is unavailable.
    } finally {
      await _clearSession();
    }
  }

  Future<void> _clearSession({String? message, bool expired = false}) async {
    await _storage.clear();
    session = null;
    attendance = null;
    errorMessage = message;
    _setPhase(expired ? SessionPhase.sessionExpired : SessionPhase.signedOut);
  }

  void _setPhase(SessionPhase value) {
    phase = value;
    notifyListeners();
  }
}
