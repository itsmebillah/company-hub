import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../tracking/tracking_controller.dart';
import 'attendance_screen.dart';
import 'home_screen.dart';
import 'profile_screen.dart';

class EmployeeShell extends StatefulWidget {
  const EmployeeShell({
    required this.controller,
    required this.trackingController,
    super.key,
  });

  final SessionController controller;
  final TrackingController trackingController;

  @override
  State<EmployeeShell> createState() => _EmployeeShellState();
}

class _EmployeeShellState extends State<EmployeeShell> {
  int _selectedIndex = 0;

  void _select(int index) {
    if (_selectedIndex == index) return;
    setState(() => _selectedIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final body = switch (_selectedIndex) {
      0 => HomeScreen(
        controller: widget.controller,
        trackingController: widget.trackingController,
        openAttendance: () => _select(1),
        openProfile: () => _select(2),
      ),
      1 => AttendanceScreen(
        controller: widget.controller,
        trackingController: widget.trackingController,
      ),
      _ => ProfileScreen(controller: widget.controller),
    };

    return Scaffold(
      body: SafeArea(child: body),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _select,
        destinations: const [
          NavigationDestination(
            key: Key('homeDestination'),
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            key: Key('attendanceDestination'),
            icon: Icon(Icons.schedule_outlined),
            selectedIcon: Icon(Icons.schedule),
            label: 'Attendance',
          ),
          NavigationDestination(
            key: Key('profileDestination'),
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
