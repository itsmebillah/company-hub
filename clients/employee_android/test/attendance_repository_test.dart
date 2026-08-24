import 'dart:convert';

import 'package:employee_android/src/network/api_client.dart';
import 'package:employee_android/src/repositories/attendance_repository.dart';
import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  const gps = AttendanceGps(
    latitude: 23.7806,
    longitude: 90.4070,
    accuracy: 12.5,
    timestamp: '2026-08-24T09:00:00.000Z',
    source: 'gps',
  );

  test(
    'check-in and checkout send the exact Production GPS contract',
    () async {
      final requests = <http.Request>[];
      final repository = AttendanceRepository(
        ApiClient(
          baseUri: Uri.parse('https://company-hub.invalid'),
          client: MockClient((request) async {
            requests.add(request);
            return http.Response(_stateResponse, 200);
          }),
        ),
      );

      await repository.checkIn('access-token', gps);
      await repository.checkOut('access-token', gps);

      expect(requests.map((request) => request.url.path), [
        '/api/mobile/v1/attendance/check-in',
        '/api/mobile/v1/attendance/check-out',
      ]);
      for (final request in requests) {
        expect(jsonDecode(request.body), {
          'gps': {
            'latitude': 23.7806,
            'longitude': 90.407,
            'accuracy': 12.5,
            'timestamp': '2026-08-24T09:00:00.000Z',
            'source': 'gps',
          },
        });
        expect(request.body, isNot(equals('{}')));
      }
    },
  );
}

const _stateResponse = '''
{
  "attendanceDate": "2026-08-24",
  "attendance": null,
  "policy": {
    "requireGps": true,
    "requireHighAccuracy": true,
    "gpsAccuracyThresholdMeters": 50
  },
  "tracking": {
    "status": "inactive",
    "sessionId": null
  }
}
''';
