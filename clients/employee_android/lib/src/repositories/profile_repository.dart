import '../models/profile_state.dart';
import '../network/api_client.dart';
class ProfileRepository {
  const ProfileRepository(this._api); final ApiClient _api;
  Future<ProfileState> getProfile(String token) async => ProfileState.fromJson(await _api.request('GET', '/api/mobile/v1/profile', accessToken: token));
  Future<ProfileState> update(String token, {required String phone, required String email, required String dateOfBirth}) async => ProfileState.fromJson(await _api.request('PATCH', '/api/mobile/v1/profile', accessToken: token, body: {'phone': phone, 'email': email, 'dateOfBirth': dateOfBirth}));
  Future<ProfileState> uploadPhoto(String token, {required List<int> bytes, required String filename, required String contentType}) async => ProfileState.fromJson(await _api.upload('/api/mobile/v1/profile', accessToken: token, field: 'photo', bytes: bytes, filename: filename, contentType: contentType));
}
