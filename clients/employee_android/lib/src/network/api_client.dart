import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/api_error.dart';

class ApiClient {
  ApiClient({required Uri baseUri, http.Client? client, Duration? timeout})
    : this._(
        baseUri,
        client ?? http.Client(),
        timeout ?? const Duration(seconds: 20),
      );

  ApiClient._(this._baseUri, this._client, this._timeout)
    : assert(_timeout > Duration.zero) {
    if (_baseUri.scheme != 'https') {
      throw StateError('The mobile API requires HTTPS.');
    }
  }

  final Uri _baseUri;
  final http.Client _client;
  final Duration _timeout;

  Future<Map<String, Object?>> request(
    String method,
    String path, {
    Map<String, Object?>? body,
    String? accessToken,
  }) async {
    final request = http.Request(method, _baseUri.resolve(path));
    request.headers['accept'] = 'application/json';
    if (body != null) {
      request.headers['content-type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    if (accessToken != null) {
      request.headers['authorization'] = 'Bearer $accessToken';
    }

    try {
      final streamed = await _client.send(request).timeout(_timeout);
      final response = await http.Response.fromStream(streamed);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (response.body.isEmpty) return const {};
        return _decodeObject(response.body);
      }
      final error = _safeError(response.body);
      throw ApiException(
        statusCode: response.statusCode,
        code: error.$1,
        message: error.$2,
        retryAfter: _retryAfter(response.headers['retry-after']),
      );
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException(
        code: 'network_timeout',
        message: 'The request timed out. Check your connection and try again.',
        outcomeAmbiguous: true,
      );
    } on http.ClientException {
      throw const ApiException(
        code: 'network_unavailable',
        message: 'Unable to reach Company Hub. Check your connection.',
        outcomeAmbiguous: true,
      );
    } on FormatException {
      throw const ApiException(
        code: 'invalid_server_response',
        message: 'Company Hub returned an invalid response.',
      );
    }
  }

  Map<String, Object?> _decodeObject(String value) {
    final decoded = jsonDecode(value);
    if (decoded is! Map<String, Object?>) throw const FormatException();
    return decoded;
  }

  (String, String) _safeError(String body) {
    try {
      final value = _decodeObject(body);
      final code = value['code'];
      final message = value['message'];
      if (code is String && message is String && message.isNotEmpty) {
        return (code, message);
      }
    } catch (_) {}
    return ('request_failed', 'The request could not be completed.');
  }

  Duration? _retryAfter(String? value) {
    final seconds = int.tryParse(value ?? '');
    return seconds == null ? null : Duration(seconds: seconds);
  }
}
