enum AppFlavor {
  qa('qa', 'Company Hub QA'),
  production('production', 'Company Hub');

  const AppFlavor(this.value, this.displayName);

  final String value;
  final String displayName;

  String get label => value.toUpperCase();

  static AppFlavor parse(String value) {
    return AppFlavor.values.firstWhere(
      (flavor) => flavor.value == value,
      orElse: () =>
          throw StateError('APP_FLAVOR must be either "qa" or "production".'),
    );
  }
}

class AppEnvironment {
  const AppEnvironment._({
    required this.flavor,
    required this.apiBaseUri,
    required this.supabaseUri,
    required this.supabaseAnonKey,
  });

  factory AppEnvironment.fromCompileTime() {
    return AppEnvironment.fromValues(
      flavor: const String.fromEnvironment('APP_FLAVOR'),
      apiBaseUrl: const String.fromEnvironment('API_BASE_URL'),
      supabaseUrl: const String.fromEnvironment('SUPABASE_URL'),
      supabaseAnonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
    );
  }

  factory AppEnvironment.fromValues({
    required String flavor,
    required String apiBaseUrl,
    required String supabaseUrl,
    required String supabaseAnonKey,
  }) {
    final parsedFlavor = AppFlavor.parse(flavor);
    final apiUri = _requireHttpsUri('API_BASE_URL', apiBaseUrl);
    final supabaseUri = _requireHttpsUri('SUPABASE_URL', supabaseUrl);
    _requireValue('SUPABASE_ANON_KEY', supabaseAnonKey);

    // Gradle validates both flavor contracts before Android builds. Keep only
    // Production literals in Dart so a Production AOT binary cannot retain a
    // QA origin while still enforcing its own runtime contract.
    if (parsedFlavor == AppFlavor.production &&
        apiUri.toString() != productionApiBaseUrl) {
      throw StateError(
        'PRODUCTION API_BASE_URL does not match its approved environment contract.',
      );
    }
    if (parsedFlavor == AppFlavor.production &&
        supabaseUri.toString() != productionSupabaseUrl) {
      throw StateError(
        'PRODUCTION SUPABASE_URL does not match its approved environment contract.',
      );
    }

    return AppEnvironment._(
      flavor: parsedFlavor,
      apiBaseUri: apiUri,
      supabaseUri: supabaseUri,
      supabaseAnonKey: supabaseAnonKey,
    );
  }

  static const productionApiBaseUrl = 'https://company-hub-zeta.vercel.app';
  static const productionSupabaseUrl =
      'https://jjfktbgfwvekhlvyjlww.supabase.co';

  final AppFlavor flavor;
  final Uri apiBaseUri;
  final Uri supabaseUri;
  final String supabaseAnonKey;

  String get displayName => flavor.displayName;

  static String _requireValue(String name, String value) {
    if (value.trim().isEmpty) {
      throw StateError('$name is required.');
    }
    return value;
  }

  static Uri _requireHttpsUri(String name, String value) {
    _requireValue(name, value);
    final uri = Uri.tryParse(value);
    if (uri == null ||
        uri.scheme != 'https' ||
        uri.host.isEmpty ||
        uri.hasQuery ||
        uri.hasFragment) {
      throw StateError(
        '$name must be an HTTPS origin without query or fragment.',
      );
    }
    return uri;
  }
}
