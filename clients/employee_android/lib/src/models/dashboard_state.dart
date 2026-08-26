import 'auth_session.dart';

class DashboardFeatureFlag {
  const DashboardFeatureFlag({required this.key, required this.enabled});

  factory DashboardFeatureFlag.fromJson(Map<String, Object?> json) =>
      DashboardFeatureFlag(
        key: json.requireString('key'),
        enabled: json['enabled'] as bool? ?? false,
      );

  final String key;
  final bool enabled;
}

class DashboardProfile {
  const DashboardProfile({
    required this.employeeId,
    required this.name,
    required this.companyId,
    required this.roleName,
    required this.companyName,
    required this.photoUrl,
  });

  factory DashboardProfile.fromJson(Map<String, Object?> json) =>
      DashboardProfile(
        employeeId: json.requireString('employeeId'),
        name: json.requireString('name'),
        companyId: json.requireString('companyId'),
        roleName: json.requireString('roleName'),
        companyName: json.requireString('companyName'),
        photoUrl: json['photoUrl'] as String?,
      );

  factory DashboardProfile.fromSession(SessionProfile profile) =>
      DashboardProfile(
        employeeId: profile.employeeId,
        name: profile.name,
        companyId: profile.companyId,
        roleName: profile.roleName,
        companyName: 'Company Hub',
        photoUrl: null,
      );

  final String employeeId;
  final String name;
  final String companyId;
  final String roleName;
  final String companyName;
  final String? photoUrl;
}

class DashboardState {
  const DashboardState({
    required this.profile,
    required this.features,
    required this.enabledFeatureKeys,
  });

  factory DashboardState.fromJson(Map<String, Object?> json) {
    final featuresValue = json['features'];
    final enabledValue = json['enabledFeatureKeys'];
    return DashboardState(
      profile: DashboardProfile.fromJson(json.requireMap('profile')),
      features: featuresValue is List
          ? featuresValue
                .whereType<Map<String, Object?>>()
                .map(DashboardFeatureFlag.fromJson)
                .toList(growable: false)
          : const [],
      enabledFeatureKeys: enabledValue is List
          ? enabledValue.whereType<String>().toList(growable: false)
          : const [],
    );
  }

  final DashboardProfile profile;
  final List<DashboardFeatureFlag> features;
  final List<String> enabledFeatureKeys;
}
