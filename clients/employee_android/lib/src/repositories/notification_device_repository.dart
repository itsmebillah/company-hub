import '../network/api_client.dart';

class NotificationDeviceRepository {
  const NotificationDeviceRepository(this._api);
  final ApiClient _api;

  Future<void> register(String accessToken, String token) async {
    await _api.request(
      'POST',
      '/api/mobile/v1/notifications/device',
      accessToken: accessToken,
      body: {'token': token, 'platform': 'android'},
    );
  }

  Future<void> remove(String accessToken, String token) async {
    await _api.request(
      'DELETE',
      '/api/mobile/v1/notifications/device',
      accessToken: accessToken,
      body: {'token': token, 'platform': 'android'},
    );
  }
}
