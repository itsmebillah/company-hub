import '../models/dashboard_state.dart';
import '../network/api_client.dart';

class DashboardRepository {
  const DashboardRepository(this._api);

  final ApiClient _api;

  Future<DashboardState> getDashboard(String accessToken) async =>
      DashboardState.fromJson(
        await _api.request(
          'GET',
          '/api/mobile/v1/dashboard',
          accessToken: accessToken,
        ),
      );

  Future<void> markNotificationRead(String accessToken, String id) async {
    await _api.request('PATCH', '/api/mobile/v1/notifications/$id', accessToken: accessToken);
  }
}
