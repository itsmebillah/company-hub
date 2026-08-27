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

  Future<String> uploadSelfie(
    String accessToken, {
    required List<int> bytes,
    required String filename,
    required String contentType,
    required String phase,
    required String attendanceDate,
  }) async {
    final response = await _api.upload(
      '/api/mobile/v1/attendance/selfie',
      accessToken: accessToken,
      field: 'file',
      bytes: bytes,
      filename: filename,
      contentType: contentType,
      fields: {'phase': phase, 'attendanceDate': attendanceDate},
    );
    final path = response['path'];
    if (path is! String || path.isEmpty) {
      throw const FormatException('Missing selfie path.');
    }
    return path;
  }
  Future<AttendanceState> checkIn(
    String accessToken,
    AttendanceGps gps, {String? selfiePath,}
  ) async => AttendanceState.fromJson(
    await _api.request(
      'POST',
      '/api/mobile/v1/attendance/check-in',
      body: {'gps': gps.toJson(), ...?selfiePath == null ? null : {'selfiePath': selfiePath}},
      accessToken: accessToken,
    ),
  );

  Future<AttendanceState> checkOut(
    String accessToken,
    AttendanceGps gps, {String? selfiePath,}
  ) async => AttendanceState.fromJson(
    await _api.request(
      'POST',
      '/api/mobile/v1/attendance/check-out',
      body: {'gps': gps.toJson(), ...?selfiePath == null ? null : {'selfiePath': selfiePath}},
      accessToken: accessToken,
    ),
  );
}
