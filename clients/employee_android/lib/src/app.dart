import 'dart:async';

import 'package:flutter/material.dart';

import 'config/app_environment.dart';
import 'controllers/session_controller.dart';
import 'network/api_client.dart';
import 'repositories/attendance_repository.dart';
import 'repositories/auth_repository.dart';
import 'storage/session_storage.dart';
import 'tracking/tracking_controller.dart';
import 'tracking/tracking_platform.dart';
import 'ui/attendance_screen.dart';
import 'ui/login_screen.dart';

class CompanyHubEmployeeApp extends StatefulWidget {
  const CompanyHubEmployeeApp({
    required this.environment,
    this.controller,
    this.trackingController,
    super.key,
  });

  final AppEnvironment environment;
  final SessionController? controller;
  final TrackingController? trackingController;

  @override
  State<CompanyHubEmployeeApp> createState() => _CompanyHubEmployeeAppState();
}

class _CompanyHubEmployeeAppState extends State<CompanyHubEmployeeApp>
    with WidgetsBindingObserver {
  late final SessionController _controller;
  late final bool _ownsController;
  late final TrackingController _trackingController;
  late final bool _ownsTrackingController;
  String? _trackingFingerprint;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _ownsController = widget.controller == null;
    _ownsTrackingController = widget.trackingController == null;
    final api = ApiClient(baseUri: widget.environment.apiBaseUri);
    _controller =
        widget.controller ??
        SessionController(
          authRepository: AuthRepository(api),
          attendanceRepository: AttendanceRepository(api),
          storage: SecureSessionStorage(),
        );
    _trackingController =
        widget.trackingController ??
        TrackingController(platform: MethodChannelTrackingPlatform());
    _controller.addListener(_synchronizeTracking);
    _controller.initialize();
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
    if (state == AppLifecycleState.resumed && _controller.session != null) {
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: widget.environment.flavor == AppFlavor.qa,
      title: widget.environment.displayName,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2556A7)),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
        useMaterial3: true,
      ),
      home: ListenableBuilder(
        listenable: _controller,
        builder: (context, _) {
          if (_controller.phase == SessionPhase.initializing) {
            return const Scaffold(
              body: SafeArea(child: Center(child: CircularProgressIndicator())),
            );
          }
          if (_controller.session == null) {
            return LoginScreen(
              appName: widget.environment.displayName,
              controller: _controller,
            );
          }
          return AttendanceScreen(
            controller: _controller,
            trackingController: _trackingController,
          );
        },
      ),
    );
  }
}
