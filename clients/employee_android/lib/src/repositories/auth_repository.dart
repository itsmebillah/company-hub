import '../models/auth_session.dart';
import '../network/api_client.dart';

class AuthRepository {
  const AuthRepository(this._api);

  final ApiClient _api;

  Future<AuthSession> login({
    required String employeeId,
    required String password,
  }) async => AuthSession.fromJson(
    await _api.request(
      'POST',
      '/api/mobile/v1/auth/session',
      body: {'employeeId': employeeId, 'password': password},
    ),
  );

  Future<AuthSession> refresh(String refreshToken) async =>
      AuthSession.fromJson(
        await _api.request(
          'POST',
          '/api/mobile/v1/auth/session/refresh',
          body: {'refreshToken': refreshToken},
        ),
      );

  Future<void> logout(String accessToken) => _api.request(
    'DELETE',
    '/api/mobile/v1/auth/session',
    accessToken: accessToken,
  );
}
