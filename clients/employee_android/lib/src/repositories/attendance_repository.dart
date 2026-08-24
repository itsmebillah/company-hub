import '../models/attendance_state.dart';
import '../network/api_client.dart';
import '../tracking/tracking_platform.dart';

class AttendanceRepository {
  const AttendanceRepository(this._api);

  final ApiClient _api;

  Future<AttendanceState> getState(String accessToken) async =>
      AttendanceState.fromJson(
        await _api.request(
          'GET',
          '/api/mobile/v1/attendance/state',
          accessToken: accessToken,
        ),
      );

  Future<AttendanceState> checkIn(
    String accessToken,
    AttendanceGps gps,
  ) async => AttendanceState.fromJson(
    await _api.request(
      'POST',
      '/api/mobile/v1/attendance/check-in',
      body: {'gps': gps.toJson()},
      accessToken: accessToken,
    ),
  );

  Future<AttendanceState> checkOut(
    String accessToken,
    AttendanceGps gps,
  ) async => AttendanceState.fromJson(
    await _api.request(
      'POST',
      '/api/mobile/v1/attendance/check-out',
      body: {'gps': gps.toJson()},
      accessToken: accessToken,
    ),
  );
}
