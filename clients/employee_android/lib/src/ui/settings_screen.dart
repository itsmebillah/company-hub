import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({
    required this.controller,
    required this.isDarkMode,
    required this.onToggleTheme,
    super.key,
  });

  final SessionController controller;
  final bool isDarkMode;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final profile = controller.session?.profile;
    return ListView(
      key: const Key('settingsScreen'),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      children: [
        Text('More', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(
          'Workspace preferences and account controls',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
            SwitchListTile(
              key: const Key('settingsThemeToggle'),
              title: const Text('Dark theme'),
              subtitle: const Text('Use a darker appearance throughout the app'),
              secondary: Icon(isDarkMode ? Icons.dark_mode : Icons.light_mode),
              value: isDarkMode,
              onChanged: (_) => onToggleTheme(),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.notifications_outlined),
              title: const Text('Notifications'),
              subtitle: const Text('Managed by your device settings'),
            ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
            ListTile(
              leading: const Icon(Icons.account_circle_outlined),
              title: const Text('Account'),
              subtitle: Text(profile == null
                  ? 'Signed-in employee account'
                  : '${profile.name} • ${profile.employeeId}'),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.info_outline),
              title: const Text('App version'),
              subtitle: const Text('0.1.4 (5)'),
            ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          key: const Key('settingsLogoutButton'),
          onPressed: controller.isBusy ? null : controller.signOut,
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
        ),
      ],
    );
  }
}
