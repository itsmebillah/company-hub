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
      _ShellDestination(
        _EmployeeDestination.updates,
        NavigationDestination(
          key: const Key('updatesDestination'),
          icon: Badge(
            isLabelVisible:
                (widget.controller.dashboard?.content.unreadNotificationCount ??
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
        : (_selected == _EmployeeDestination.attendance ||
                  _selected == _EmployeeDestination.quickLinks
              ? _selected
              : _EmployeeDestination.home);
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

    final navigationIndex = destinations.indexWhere(
      (item) => item.value == selected,
    );

    return Scaffold(
      extendBody: true,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _WorkspaceHeader(
              controller: widget.controller,
              isDarkMode: widget.isDarkMode,
              onToggleTheme: widget.onToggleTheme,
              onOpenUpdates: () => _select(_EmployeeDestination.updates),
            ),
            Expanded(child: body),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: Semantics(
        button: true,
        label: 'Open employee actions',
        child: FloatingActionButton(
          key: const Key('employeeActionsButton'),
          tooltip: 'Employee actions',
          onPressed: () => _showEmployeeActions(features),
          child: const Icon(Icons.apps_rounded),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        height: 72,
        selectedIndex: navigationIndex < 0 ? 0 : navigationIndex,
        onDestinationSelected: (index) => _select(destinations[index].value),
        destinations: destinations.map((item) => item.destination).toList(),
      ),
    );
  }

  Future<void> _showEmployeeActions(Set<String> features) async {
    final destination = await showModalBottomSheet<_EmployeeDestination>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Employee actions',
                style: Theme.of(context).textTheme.titleLarge
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              ListTile(
                key: const Key('attendanceDestination'),
                leading: const Icon(Icons.schedule_outlined),
                title: const Text('Attendance'),
                subtitle: const Text('Check in, check out, and review today'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () =>
                    Navigator.pop(context, _EmployeeDestination.attendance),
              ),
              if (features.contains('quick_links'))
                ListTile(
                  key: const Key('quickLinksDestination'),
                  leading: const Icon(Icons.link_outlined),
                  title: const Text('Quick Links'),
                  subtitle: const Text('Open your approved resources'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () =>
                      Navigator.pop(context, _EmployeeDestination.quickLinks),
                ),
            ],
          ),
        ),
      ),
    );
    if (destination != null && mounted) _select(destination);
  }
}

class _WorkspaceHeader extends StatelessWidget {
  const _WorkspaceHeader({
    required this.controller,
    required this.isDarkMode,
    required this.onToggleTheme,
    required this.onOpenUpdates,
  });

  final SessionController controller;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;
  final VoidCallback? onOpenUpdates;

  @override
  Widget build(BuildContext context) {
    final profile = controller.dashboard?.profile;
    final companyName = profile?.companyName ?? 'Company Hub';
    final unread = controller.dashboard?.content.unreadNotificationCount ?? 0;
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 2),
      child: Material(
        color: colors.surfaceContainerLow,
        elevation: 1,
        shadowColor: colors.shadow.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [colors.primary, colors.tertiary],
                  ),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const SizedBox.square(
                  dimension: 44,
                  child: Icon(Icons.apartment_rounded, color: Colors.white),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      companyName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      'WORKSPACE',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.onSurfaceVariant,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                key: const Key('homeUpdatesButton'),
                tooltip: 'Notifications',
                onPressed: onOpenUpdates,
                icon: Badge(
                  isLabelVisible: unread > 0,
                  label: Text(unread > 99 ? '99+' : '$unread'),
                  child: const Icon(Icons.notifications_none_rounded),
                ),
              ),
              IconButton(
                key: const Key('workspaceThemeButton'),
                tooltip: isDarkMode ? 'Use light theme' : 'Use dark theme',
                onPressed: onToggleTheme,
                icon: Icon(
                  isDarkMode
                      ? Icons.light_mode_outlined
                      : Icons.dark_mode_outlined,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
