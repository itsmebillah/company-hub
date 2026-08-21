import 'auth_session.dart';

class AttendanceRecord {
  const AttendanceRecord({
    required this.id,
    required this.attendanceDate,
    required this.checkIn,
    required this.checkOut,
    required this.status,
    required this.workingMinutes,
  });

  factory AttendanceRecord.fromJson(Map<String, Object?> json) =>
      AttendanceRecord(
        id: json.requireString('id'),
        attendanceDate: json.requireString('attendanceDate'),
        checkIn: json['checkIn'] as String?,
        checkOut: json['checkOut'] as String?,
        status: json.requireString('status'),
        workingMinutes: json.requireInt('workingMinutes'),
      );

  final String id;
  final String attendanceDate;
  final String? checkIn;
  final String? checkOut;
  final String status;
  final int workingMinutes;

  bool get isCheckedIn => checkIn != null && checkOut == null;
  bool get isCheckedOut => checkOut != null;
}

class TrackingSessionState {
  const TrackingSessionState({required this.status, required this.sessionId});

  factory TrackingSessionState.fromJson(Map<String, Object?> json) =>
      TrackingSessionState(
        status: json.requireString('status'),
        sessionId: json['sessionId'] as String?,
      );

  final String status;
  final String? sessionId;
}

class AttendanceState {
  const AttendanceState({
    required this.attendanceDate,
    required this.attendance,
    required this.tracking,
  });

  factory AttendanceState.fromJson(Map<String, Object?> json) {
    final attendance = json['attendance'];
    return AttendanceState(
      attendanceDate: json.requireString('attendanceDate'),
      attendance: attendance is Map<String, Object?>
          ? AttendanceRecord.fromJson(attendance)
          : null,
      tracking: TrackingSessionState.fromJson(json.requireMap('tracking')),
    );
  }

  final String attendanceDate;
  final AttendanceRecord? attendance;
  final TrackingSessionState tracking;

  bool get canCheckIn => attendance == null;
  bool get canCheckOut => attendance?.isCheckedIn ?? false;
}
