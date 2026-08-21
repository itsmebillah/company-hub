import 'package:employee_android/src/config/app_environment.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('AppEnvironment', () {
    test('accepts the QA contract', () {
      final environment = AppEnvironment.fromValues(
        flavor: 'qa',
        apiBaseUrl: AppEnvironment.qaApiBaseUrl,
        supabaseUrl: AppEnvironment.qaSupabaseUrl,
        supabaseAnonKey: 'qa-public-anon-placeholder',
      );

      expect(environment.flavor, AppFlavor.qa);
      expect(environment.apiBaseUri.isScheme('https'), isTrue);
    });

    test('accepts the production contract', () {
      final environment = AppEnvironment.fromValues(
        flavor: 'production',
        apiBaseUrl: AppEnvironment.productionApiBaseUrl,
        supabaseUrl: AppEnvironment.productionSupabaseUrl,
        supabaseAnonKey: 'production-public-anon-placeholder',
      );

      expect(environment.flavor, AppFlavor.production);
    });

    test('rejects QA configured with the production API', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'qa',
          apiBaseUrl: AppEnvironment.productionApiBaseUrl,
          supabaseUrl: AppEnvironment.qaSupabaseUrl,
          supabaseAnonKey: 'qa-public-anon-placeholder',
        ),
        throwsStateError,
      );
    });

    test('rejects production configured with the QA API', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'production',
          apiBaseUrl: AppEnvironment.qaApiBaseUrl,
          supabaseUrl: AppEnvironment.productionSupabaseUrl,
          supabaseAnonKey: 'production-public-anon-placeholder',
        ),
        throwsStateError,
      );
    });

    test('rejects missing public Supabase configuration', () {
      expect(
        () => AppEnvironment.fromValues(
          flavor: 'qa',
          apiBaseUrl: AppEnvironment.qaApiBaseUrl,
          supabaseUrl: AppEnvironment.qaSupabaseUrl,
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
          supabaseUrl: AppEnvironment.qaSupabaseUrl,
          supabaseAnonKey: 'qa-public-anon-placeholder',
        ),
        throwsStateError,
      );
    });
  });
}
