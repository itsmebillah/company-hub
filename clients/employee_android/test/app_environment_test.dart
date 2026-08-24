import 'package:employee_android/src/config/app_environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const qaApiUrl = 'https://company-hub-qa.onrender.com';
  const qaSupabaseUrl = 'https://qa-project.supabase.co';
  const productionApiUrl = 'https://company-hub-zeta.vercel.app';
  const productionSupabaseUrl = 'https://jjfktbgfwvekhlvyjlww.supabase.co';

  group('AppEnvironment', () {
    test('accepts the QA contract values supplied by the build', () {
      final environment = AppEnvironment.fromValues(
        flavor: 'qa',
        apiBaseUrl: qaApiUrl,
        supabaseUrl: qaSupabaseUrl,
        supabaseAnonKey: 'qa-public-anon-placeholder',
      );

      expect(environment.flavor, AppFlavor.qa);
      expect(environment.apiBaseUri.isScheme('https'), isTrue);
    });

    test('accepts the production contract values supplied by the build', () {
      final environment = AppEnvironment.fromValues(
        flavor: 'production',
        apiBaseUrl: productionApiUrl,
        supabaseUrl: productionSupabaseUrl,
        supabaseAnonKey: 'production-public-anon-placeholder',
      );

      expect(environment.flavor, AppFlavor.production);
    });

    test('rejects an unsupported flavor', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'development',
          apiBaseUrl: productionApiUrl,
          supabaseUrl: productionSupabaseUrl,
          supabaseAnonKey: 'public-key',
        ),
        throwsStateError,
      );
    });

    test('rejects missing public Supabase configuration', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'qa',
          apiBaseUrl: qaApiUrl,
          supabaseUrl: qaSupabaseUrl,
          supabaseAnonKey: '',
        ),
        throwsStateError,
      );
    });

    test('rejects non-HTTPS API configuration', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'qa',
          apiBaseUrl: 'http://qa-api.company-hub.invalid',
          supabaseUrl: qaSupabaseUrl,
          supabaseAnonKey: 'qa-public-anon-placeholder',
        ),
        throwsStateError,
      );
    });

    test('rejects endpoint query parameters', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'production',
          apiBaseUrl: '$productionApiUrl?debug=true',
          supabaseUrl: productionSupabaseUrl,
          supabaseAnonKey: 'public-key',
        ),
        throwsStateError,
      );
    });
  });
}
