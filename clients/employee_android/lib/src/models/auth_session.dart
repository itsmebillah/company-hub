class SessionProfile {
  const SessionProfile({
    required this.employeeId,
    required this.name,
    required this.companyId,
    required this.roleName,
  });

  factory SessionProfile.fromJson(Map<String, Object?> json) => SessionProfile(
    employeeId: json.requireString('employeeId'),
    name: json.requireString('name'),
    companyId: json.requireString('companyId'),
    roleName: json.requireString('roleName'),
  );

  final String employeeId;
  final String name;
  final String companyId;
  final String roleName;

  Map<String, Object?> toJson() => {
    'employeeId': employeeId,
    'name': name,
    'companyId': companyId,
    'roleName': roleName,
  };
}

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
    required this.profile,
  });

  factory AuthSession.fromJson(Map<String, Object?> json) => AuthSession(
    accessToken: json.requireString('accessToken'),
    refreshToken: json.requireString('refreshToken'),
    expiresAt: DateTime.fromMillisecondsSinceEpoch(
      json.requireInt('expiresAt') * 1000,
      isUtc: true,
    ),
    profile: SessionProfile.fromJson(json.requireMap('profile')),
  );

  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;
  final SessionProfile profile;

  Map<String, Object?> toJson() => {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
    'expiresAt': expiresAt.millisecondsSinceEpoch ~/ 1000,
    'profile': profile.toJson(),
  };
}

extension RequiredJson on Map<String, Object?> {
  String requireString(String key) {
    final value = this[key];
    if (value is! String || value.isEmpty) throw const FormatException();
    return value;
  }

  int requireInt(String key) {
    final value = this[key];
    if (value is! num) throw const FormatException();
    return value.toInt();
  }

  Map<String, Object?> requireMap(String key) {
    final value = this[key];
    if (value is! Map<String, Object?>) throw const FormatException();
    return value;
  }
}
