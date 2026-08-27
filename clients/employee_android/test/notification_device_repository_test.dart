import 'dart:convert';

import 'package:employee_android/src/network/api_client.dart';
import 'package:employee_android/src/repositories/notification_device_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('registers and removes an Android token with bearer auth', () async {
    final requests = <http.Request>[];
    final client = ApiClient(
      baseUri: Uri.parse('https://qa.company-hub.invalid'),
      client: MockClient((request) async {
        requests.add(request);
        return http.Response('{}', 200);
      }),
    );
    final repository = NotificationDeviceRepository(client);
    await repository.register('access-token', 'token-value-123456789012');
    await repository.remove('access-token', 'token-value-123456789012');
    expect(requests.map((request) => request.method), ['POST', 'DELETE']);
    expect(
      requests.every(
        (request) => request.headers['authorization'] == 'Bearer access-token',
      ),
      isTrue,
    );
    expect(jsonDecode(requests.first.body), {
      'token': 'token-value-123456789012',
      'platform': 'android',
    });
  });
}
