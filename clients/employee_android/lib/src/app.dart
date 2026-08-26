import 'dart:async';

import 'package:flutter/material.dart';

import 'config/app_environment.dart';
import 'controllers/session_controller.dart';
import 'network/api_client.dart';
import 'platform/external_link_platform.dart';
import 'repositories/attendance_repository.dart';
import 'repositories/auth_repository.dart';
import 'repositories/dashboard_repository.dart';
import 'repositories/profile_repository.dart';
import 'storage/session_storage.dart';
import 'tracking/tracking_controller.dart';
import 'tracking/tracking_platform.dart';
import 'ui/employee_shell.dart';
import 'ui/login_screen.dart';
import 'ui/permission_gate.dart';
import 'updates/update_controller.dart';
import 'updates/update_platform.dart';
import 'updates/update_reminder.dart';
import 'updates/update_service.dart';

class CompanyHubEmployeeApp extends StatefulWidget {
  const CompanyHubEmployeeApp({
    required this.environment,
    this.controller,
    this.trackingController,
    this.externalLinkPlatform,
    super.key,
  });

  final AppEnvironment environment;
  final SessionController? controller;
  final TrackingController? trackingController;
  final ExternalLinkPlatform? externalLinkPlatform;

  @override
  State<CompanyHubEmployeeApp> createState() => _CompanyHubEmployeeAppState();
}

class _CompanyHubEmployeeAppState extends State<CompanyHubEmployeeApp>
    with WidgetsBindingObserver {
  ThemeMode _themeMode = ThemeMode.light;
  late final SessionController _controller;
  late final bool _ownsController;
  late final TrackingController _trackingController;
  late final bool _ownsTrackingController;
  String? _trackingFingerprint;
  late final UpdateController _updateController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _ownsController = widget.controller == null;
    _ownsTrackingController = widget.trackingController == null;
    final api = ApiClient(baseUri: widget.environment.apiBaseUri);
    final trackingPlatform = MethodChannelTrackingPlatform();
    _controller =
        widget.controller ??
        SessionController(
          authRepository: AuthRepository(api),
          attendanceRepository: AttendanceRepository(api),
          dashboardRepository: DashboardRepository(api),
          profileRepository: ProfileRepository(api),
          storage: SecureSessionStorage(),
          locationPlatform: trackingPlatform,
        );
    _trackingController =
        widget.trackingController ??
        TrackingController(platform: trackingPlatform);
    _updateController = UpdateController(
      environment: widget.environment,
      service: GitHubReleaseUpdateService(
        platform: MethodChannelUpdatePlatform(),
        environment: widget.environment,
      ),
    );
    _controller.addListener(_synchronizeTracking);
    _controller.initialize();
    unawaited(_trackingController.initializePermissions());
    unawaited(_updateController.check());
  }

  void _synchronizeTracking() {
    if (_controller.phase != SessionPhase.authenticated &&
        _controller.session != null) {
      return;
    }
    final tracking = _controller.attendance?.tracking;
    final fingerprint = _controller.session == null
        ? 'signed-out'
        : '${tracking?.status}:${tracking?.sessionId}:'
              '${_controller.session?.accessToken.hashCode}';
    if (_trackingFingerprint == fingerprint) return;
    _trackingFingerprint = fingerprint;
    unawaited(
      _trackingController.reconcile(
        _controller.attendance,
        apiBaseUrl: widget.environment.apiBaseUri.toString(),
        accessToken: _controller.session?.accessToken,
      ),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    unawaited(_trackingController.refresh());
    unawaited(_updateController.check());
    if (_controller.session != null) {
      unawaited(_reconcileAfterResume());
    }
  }

  Future<void> _reconcileAfterResume() async {
    await _controller.reconcile();
    if (!mounted || _controller.session == null) return;
    await _trackingController.reconcile(
      _controller.attendance,
      apiBaseUrl: widget.environment.apiBaseUri.toString(),
      accessToken: _controller.session?.accessToken,
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.removeListener(_synchronizeTracking);
    if (_ownsController) _controller.dispose();
    if (_ownsTrackingController) _trackingController.dispose();
    _updateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: widget.environment.flavor == AppFlavor.qa,
      title: widget.environment.displayName,
      themeMode: _themeMode,
      theme: ThemeData(
        colorScheme: const ColorScheme.light(
          primary: Color(0xFF2C6DD3),
          onPrimary: Color(0xFFF9FBFF),
          secondary: Color(0xFFE4EEFA),
          onSecondary: Color(0xFF2B384D),
          tertiary: Color(0xFF6596DE),
          onTertiary: Color(0xFFF9FBFF),
          error: Color(0xFFE2403A),
          onError: Color(0xFFF9FBFF),
          surface: Color(0xFFFDFEFF),
          onSurface: Color(0xFF1B2433),
          surfaceContainerHighest: Color(0xFFECF2F9),
          onSurfaceVariant: Color(0xFF5E6A7B),
          outline: Color(0xFFD6DDE6),
          outlineVariant: Color(0xFFD6DDE6),
        ),
        scaffoldBackgroundColor: const Color(0xFFF5F8FC),
        cardTheme: const CardThemeData(
          elevation: 0,
          margin: EdgeInsets.zero,
          color: Color(0xFFFDFEFF),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(24)),
            side: BorderSide(color: Color(0xFFD6DDE6)),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          height: 72,
          elevation: 3,
          backgroundColor: const Color(0xFFFDFEFF),
          indicatorColor: const Color(0xFFDAEBFD),
          indicatorShape: const StadiumBorder(),
          iconTheme: WidgetStateProperty.resolveWith(
            (states) => IconThemeData(
              color: states.contains(WidgetState.selected)
                  ? const Color(0xFF2C6DD3)
                  : const Color(0xFF5E6A7B),
            ),
          ),
          labelTextStyle: WidgetStateProperty.resolveWith(
            (states) => TextStyle(
              color: states.contains(WidgetState.selected)
                  ? const Color(0xFF2C6DD3)
                  : const Color(0xFF5E6A7B),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        badgeTheme: const BadgeThemeData(
          backgroundColor: Color(0xFFE2403A),
          textColor: Color(0xFFF9FBFF),
        ),
        dividerColor: const Color(0xFFD6DDE6),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            minimumSize: const Size(48, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF649FF4),
          onPrimary: Color(0xFF0D131E),
          secondary: Color(0xFF21272F),
          onSecondary: Color(0xFFEBEFF5),
          tertiary: Color(0xFF71A3EC),
          onTertiary: Color(0xFF0D131E),
          error: Color(0xFFEC5D4F),
          onError: Color(0xFFF2F5FC),
          surface: Color(0xFF131B28),
          onSurface: Color(0xFFEEF2F9),
          surfaceContainerHighest: Color(0xFF1D2229),
          onSurfaceVariant: Color(0xFFA7AEBA),
          outline: Color(0xFF2D333C),
          outlineVariant: Color(0xFF2D333C),
        ),
        scaffoldBackgroundColor: const Color(0xFF0C121D),
        cardTheme: const CardThemeData(
          elevation: 0,
          margin: EdgeInsets.zero,
          color: Color(0xFF131B28),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(24)),
            side: BorderSide(color: Color(0xFF2D333C)),
          ),
        ),
        navigationBarTheme: NavigationBarThemeData(
          height: 72,
          elevation: 3,
          backgroundColor: const Color(0xFF131B28),
          indicatorColor: const Color(0xFF252C35),
          indicatorShape: const StadiumBorder(),
          iconTheme: WidgetStateProperty.resolveWith(
            (states) => IconThemeData(
              color: states.contains(WidgetState.selected)
                  ? const Color(0xFF649FF4)
                  : const Color(0xFFA7AEBA),
            ),
          ),
          labelTextStyle: WidgetStateProperty.resolveWith(
            (states) => TextStyle(
              color: states.contains(WidgetState.selected)
                  ? const Color(0xFF649FF4)
                  : const Color(0xFFA7AEBA),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        badgeTheme: const BadgeThemeData(
          backgroundColor: Color(0xFFEC5D4F),
          textColor: Color(0xFFF2F5FC),
        ),
        dividerColor: const Color(0xFF2D333C),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            minimumSize: const Size(48, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
        ),
        useMaterial3: true,
      ),
      home: UpdateReminder(
        controller: _updateController,
        child: ListenableBuilder(
          listenable: _trackingController,
          builder: (context, _) {
            if (_trackingController.requiresPermissionGate) {
              return PermissionGate(controller: _trackingController);
            }
            return ListenableBuilder(
              listenable: _controller,
              builder: (context, _) {
                if (_controller.phase == SessionPhase.initializing) {
                  return const Scaffold(
                    body: SafeArea(
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  );
                }
                if (_controller.session == null) {
                  return LoginScreen(
                    appName: widget.environment.displayName,
                    controller: _controller,
                  );
                }
                return EmployeeShell(
                  controller: _controller,
                  trackingController: _trackingController,
                  linkPlatform:
                      widget.externalLinkPlatform ??
                      const MethodChannelExternalLinkPlatform(),
                  isDarkMode: _themeMode == ThemeMode.dark,
                  onToggleTheme: () => setState(() {
                    _themeMode = _themeMode == ThemeMode.dark
                        ? ThemeMode.light
                        : ThemeMode.dark;
                  }),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
