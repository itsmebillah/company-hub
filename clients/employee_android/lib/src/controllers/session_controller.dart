import 'package:flutter/foundation.dart';

import '../models/api_error.dart';
import '../models/attendance_state.dart';
import '../models/auth_session.dart';
import '../models/dashboard_state.dart';
import '../models/profile_state.dart';
import '../repositories/attendance_repository.dart';
import '../repositories/auth_repository.dart';
import '../repositories/dashboard_repository.dart';
import '../repositories/profile_repository.dart';
import '../storage/session_storage.dart';
import '../tracking/tracking_platform.dart';

enum SessionPhase {
  initializing,
  signedOut,
  signingIn,
  authenticated,
  refreshing,
  reconciling,
  acquiringLocation,
  signingOut,
  sessionExpired,
}

class SessionController extends ChangeNotifier {
  SessionController({
    required AuthRepository authRepository,
    required AttendanceRepository attendanceRepository,
    DashboardRepository? dashboardRepository,
    ProfileRepository? profileRepository,
    required SessionStorage storage,
    required TrackingPlatform locationPlatform,
  }) : this._(
         authRepository,
         attendanceRepository,
         dashboardRepository,
         storage,
       locationPlatform, profileRepository,
       );

  SessionController._(
    this._authRepository,
    this._attendanceRepository,
    this._dashboardRepository,
    this._storage,
    this._locationPlatform,
    this._profileRepository,
  );

  final AuthRepository _authRepository;
  final AttendanceRepository _attendanceRepository;
  final DashboardRepository? _dashboardRepository;
  final SessionStorage _storage;
  final TrackingPlatform _locationPlatform;
  final ProfileRepository? _profileRepository;

  SessionPhase phase = SessionPhase.initializing;
  AuthSession? session;
  AttendanceState? attendance;
  DashboardState? dashboard;
  bool isDashboardLoading = false;
  String? dashboardErrorMessage;
  String? errorMessage;
  ProfileState? profile;
  bool isProfileLoading = false;
  String? profileError;

  bool get isBusy => switch (phase) {
    SessionPhase.initializing ||
    SessionPhase.signingIn ||
    SessionPhase.refreshing ||
    SessionPhase.reconciling ||
    SessionPhase.acquiringLocation ||
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
    await loadDashboard();
    await loadProfile();
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
      await loadDashboard();
      await loadProfile();
      await reconcile();
    } on ApiException catch (error) {
      await _clearSession(
        message: error.message,
        expired: error.isUnauthorized,
      );
    }
  }

  Future<void> loadProfile() async {
    if (session == null || _profileRepository == null) return;
    isProfileLoading = true; profileError = null; notifyListeners();
    final repository = _profileRepository;
    try { profile = await _authorized(repository.getProfile); }
    on ApiException catch (error) { profileError = error.message; }
    finally { isProfileLoading = false; notifyListeners(); }
  }

  Future<bool> updateProfile({required String phone, required String email, required String dateOfBirth}) async {
    if (session == null || _profileRepository == null) return false;
    final repository = _profileRepository;
    try { profile = await _authorized((token) => repository.update(token, phone: phone, email: email, dateOfBirth: dateOfBirth)); notifyListeners(); return profile != null; }
    on ApiException catch (error) { profileError = error.message; notifyListeners(); return false; }
  }
  Future<bool> uploadProfilePhoto({required List<int> bytes, required String filename, required String contentType}) async { if (session == null || _profileRepository == null) return false; final repository = _profileRepository; try { profile = await _authorized((token) => repository.uploadPhoto(token, bytes: bytes, filename: filename, contentType: contentType)); notifyListeners(); return profile != null; } on ApiException catch (error) { profileError = error.message; notifyListeners(); return false; } }

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

  Future<void> loadDashboard() async {
    final repository = _dashboardRepository;
    if (session == null || repository == null) return;
    isDashboardLoading = true;
    dashboardErrorMessage = null;
    notifyListeners();
    try {
      final state = await _authorized(repository.getDashboard);
      if (state != null) dashboard = state;
    } on ApiException catch (error) {
      dashboardErrorMessage = error.message;
    } finally {
      isDashboardLoading = false;
      notifyListeners();
    }
  }

  Future<bool> markNotificationRead(String id) async {
    final repository = _dashboardRepository;
    if (repository == null || session == null) return false;
    try {
      await _authorized((token) => repository.markNotificationRead(token, id));
      await loadDashboard();
      return true;
    } on ApiException catch (error) {
      dashboardErrorMessage = error.message;
      notifyListeners();
      return false;
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

  Future<void> checkIn({String? selfiePath}) => _mutateAttendance(_attendanceRepository.checkIn, selfiePath: selfiePath);
  Future<void> checkOut({String? selfiePath}) => _mutateAttendance(_attendanceRepository.checkOut, selfiePath: selfiePath);

  Future<String?> uploadAttendanceSelfie({required List<int> bytes, required String filename, required String contentType, required String phase}) async {
    final date = attendance?.attendanceDate;
    if (session == null || date == null) return null;
    try {
      return await _authorized((token) => _attendanceRepository.uploadSelfie(token, bytes: bytes, filename: filename, contentType: contentType, phase: phase, attendanceDate: date));
    } on ApiException catch (error) {
      errorMessage = error.message; notifyListeners(); return null;
    } on FormatException {
      errorMessage = 'The selfie upload response was invalid.'; notifyListeners(); return null;
    }
  }

  Future<void> _mutateAttendance(
    Future<AttendanceState> Function(String token, AttendanceGps gps, {String? selfiePath}) operation,
    {String? selfiePath,}
  ) async {
    if (session == null) return;
    errorMessage = null;
    String? mutationError;
    _setPhase(SessionPhase.acquiringLocation);
    try {
      final policy = attendance?.policy;
      final threshold = policy?.gpsAccuracyThresholdMeters ?? 50;
      final gps = await _locationPlatform.getCurrentPosition(
        maxAccuracyMeters: threshold,
      );
      if (!gps.isUsable) {
        throw const AttendanceLocationException('location_unavailable');
      }
      if ((policy?.requireHighAccuracy ?? true) && gps.accuracy > threshold) {
        mutationError =
            'GPS accuracy is ${gps.accuracy.round()}m. Attendance requires ${threshold.round()}m or better.';
      } else {
        _setPhase(SessionPhase.reconciling);
        await _authorized((token) => operation(token, gps, selfiePath: selfiePath));
      }
    } on AttendanceLocationException catch (error) {
      mutationError = error.userMessage;
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
    dashboard = null;
    isDashboardLoading = false;
    dashboardErrorMessage = null;
    errorMessage = message;
    _setPhase(expired ? SessionPhase.sessionExpired : SessionPhase.signedOut);
  }

  void _setPhase(SessionPhase value) {
    phase = value;
    notifyListeners();
  }
}
