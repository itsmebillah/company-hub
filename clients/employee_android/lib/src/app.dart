import 'package:flutter/material.dart';

import 'config/app_environment.dart';
import 'controllers/session_controller.dart';
import 'network/api_client.dart';
import 'repositories/attendance_repository.dart';
import 'repositories/auth_repository.dart';
import 'storage/session_storage.dart';
import 'ui/attendance_screen.dart';
import 'ui/login_screen.dart';

class CompanyHubEmployeeApp extends StatefulWidget {
  const CompanyHubEmployeeApp({
    required this.environment,
    this.controller,
    super.key,
  });

  final AppEnvironment environment;
  final SessionController? controller;

  @override
  State<CompanyHubEmployeeApp> createState() => _CompanyHubEmployeeAppState();
}

class _CompanyHubEmployeeAppState extends State<CompanyHubEmployeeApp>
    with WidgetsBindingObserver {
  late final SessionController _controller;
  late final bool _ownsController;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _ownsController = widget.controller == null;
    final api = ApiClient(baseUri: widget.environment.apiBaseUri);
    _controller =
        widget.controller ??
        SessionController(
          authRepository: AuthRepository(api),
          attendanceRepository: AttendanceRepository(api),
          storage: SecureSessionStorage(),
        );
    _controller.initialize();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _controller.session != null) {
      _controller.reconcile();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    if (_ownsController) _controller.dispose();
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
          return AttendanceScreen(controller: _controller);
        },
      ),
    );
  }
}
