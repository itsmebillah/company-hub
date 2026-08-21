import 'dart:convert';

import 'package:employee_android/src/models/api_error.dart';
import 'package:employee_android/src/network/api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  test('adds bearer authorization without changing the body', () async {
    final client = ApiClient(
      baseUri: Uri.parse('https://qa.company-hub.invalid'),
      client: MockClient((request) async {
        expect(request.headers['authorization'], 'Bearer token-value');
        expect(jsonDecode(request.body), {'value': 'safe'});
        return http.Response('{}', 200);
      }),
    );
    await client.request(
      'POST',
      '/resource',
      body: {'value': 'safe'},
      accessToken: 'token-value',
    );
  });

  for (final status in [401, 403, 409, 429, 503]) {
    test('maps HTTP $status to a safe typed exception', () async {
      final client = ApiClient(
        baseUri: Uri.parse('https://qa.company-hub.invalid'),
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({'code': 'safe_code', 'message': 'Safe message.'}),
            status,
            headers: {'retry-after': '17'},
          ),
        ),
      );
      await expectLater(
        client.request('GET', '/resource'),
        throwsA(
          isA<ApiException>()
              .having((error) => error.statusCode, 'status', status)
              .having((error) => error.code, 'code', 'safe_code')
              .having(
                (error) => error.retryAfter,
                'retryAfter',
                const Duration(seconds: 17),
              ),
        ),
      );
    });
  }

  test('rejects non-HTTPS origins', () {
    expect(
      () => ApiClient(baseUri: Uri.parse('http://localhost')),
      throwsStateError,
    );
  });

  test('does not expose malformed raw server bodies', () async {
    const providerSecret = 'provider-private-detail';
    final client = ApiClient(
      baseUri: Uri.parse('https://qa.company-hub.invalid'),
      client: MockClient((_) async => http.Response(providerSecret, 500)),
    );
    try {
      await client.request('GET', '/resource');
      fail('Expected ApiException.');
    } on ApiException catch (error) {
      expect(error.message, isNot(contains(providerSecret)));
      expect(error.toString(), isNot(contains(providerSecret)));
    }
  });
}
