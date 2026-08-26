import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../platform/external_link_platform.dart';
import '../tracking/tracking_controller.dart';
import 'attendance_screen.dart';
import 'dashboard_features.dart';
import 'home_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class EmployeeShell extends StatefulWidget {
  const EmployeeShell({
    required this.controller,
    required this.trackingController,
    required this.linkPlatform,
    required this.isDarkMode,
    required this.onToggleTheme,
    super.key,
  });

  final SessionController controller;
  final TrackingController trackingController;
  final ExternalLinkPlatform linkPlatform;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  @override
  State<EmployeeShell> createState() => _EmployeeShellState();
}

enum _EmployeeDestination {
  home,
  attendance,
  updates,
  quickLinks,
  profile,
  settings,
}

class _ShellDestination {
  const _ShellDestination(this.value, this.destination);
  final _EmployeeDestination value;
  final NavigationDestination destination;
}

class _EmployeeShellState extends State<EmployeeShell> {
  _EmployeeDestination _selected = _EmployeeDestination.home;

  void _select(_EmployeeDestination value) {
    if (_selected == value) return;
    setState(() => _selected = value);
  }

  @override
  Widget build(BuildContext context) {
    final features =
        widget.controller.dashboard?.enabledFeatureKeys.toSet() ?? {};
    final destinations = <_ShellDestination>[
      const _ShellDestination(
        _EmployeeDestination.home,
        NavigationDestination(
          key: Key('homeDestination'),
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Hub',
        ),
      ),
      const _ShellDestination(
        _EmployeeDestination.attendance,
        NavigationDestination(
          key: Key('attendanceDestination'),
          icon: Icon(Icons.schedule_outlined),
          selectedIcon: Icon(Icons.schedule),
          label: 'Attendance',
        ),
      ),
      if (features.contains('announcements') ||
          features.contains('notifications'))
        _ShellDestination(
          _EmployeeDestination.updates,
          NavigationDestination(
            key: const Key('updatesDestination'),
            icon: Badge(
              isLabelVisible:
                  (widget
                          .controller
                          .dashboard
                          ?.content
                          .unreadNotificationCount ??
                      0) >
                  0,
              label: Text(
                '${widget.controller.dashboard?.content.unreadNotificationCount ?? 0}',
              ),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: const Icon(Icons.notifications),
            label: 'Updates',
          ),
        ),
      if (features.contains('quick_links'))
        const _ShellDestination(
          _EmployeeDestination.quickLinks,
          NavigationDestination(
            key: Key('quickLinksDestination'),
            icon: Icon(Icons.link_outlined),
            selectedIcon: Icon(Icons.link),
            label: 'Links',
          ),
        ),
      const _ShellDestination(
        _EmployeeDestination.profile,
        NavigationDestination(
          key: Key('profileDestination'),
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Me',
        ),
      ),
      const _ShellDestination(
        _EmployeeDestination.settings,
        NavigationDestination(
          key: Key('settingsDestination'),
          icon: Icon(Icons.more_horiz),
          selectedIcon: Icon(Icons.more_horiz),
          label: 'More',
        ),
      ),
    ];
    final selected = destinations.any((item) => item.value == _selected)
        ? _selected
        : _EmployeeDestination.home;
    final body = switch (selected) {
      _EmployeeDestination.home => HomeScreen(
        controller: widget.controller,
        trackingController: widget.trackingController,
        openAttendance: () => _select(_EmployeeDestination.attendance),
        openProfile: () => _select(_EmployeeDestination.profile),
        openUpdates: () => _select(_EmployeeDestination.updates),
        openQuickLinks: () => _select(_EmployeeDestination.quickLinks),
      ),
      _EmployeeDestination.attendance => AttendanceScreen(
        controller: widget.controller,
        trackingController: widget.trackingController,
      ),
      _EmployeeDestination.updates => UpdatesScreen(
        controller: widget.controller,
      ),
      _EmployeeDestination.quickLinks => QuickLinksScreen(
        controller: widget.controller,
        linkPlatform: widget.linkPlatform,
      ),
      _EmployeeDestination.profile => ProfileScreen(
        controller: widget.controller,
      ),
      _EmployeeDestination.settings => SettingsScreen(
        controller: widget.controller,
        isDarkMode: widget.isDarkMode,
        onToggleTheme: widget.onToggleTheme,
      ),
    };

    return Scaffold(
      body: SafeArea(child: body),
      bottomNavigationBar: NavigationBar(
        selectedIndex: destinations.indexWhere(
          (item) => item.value == selected,
        ),
        onDestinationSelected: (index) => _select(destinations[index].value),
        destinations: destinations.map((item) => item.destination).toList(),
      ),
    );
  }
}
