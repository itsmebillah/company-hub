import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({required this.controller, super.key});

  final SessionController controller;

  @override
  Widget build(BuildContext context) {
    final profile = controller.session!.profile;
    return ListView(
      key: const Key('profileScreen'),
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      children: [
        Center(
          child: CircleAvatar(
            key: const Key('profileAvatar'),
            radius: 42,
            child: Text(
              _initials(profile.name),
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          profile.name,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        Text(
          profile.roleName,
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 24),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.badge_outlined),
                title: const Text('Employee ID'),
                subtitle: Text(
                  profile.employeeId,
                  key: const Key('profileEmployeeId'),
                ),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.work_outline),
                title: const Text('Role'),
                subtitle: Text(profile.roleName, key: const Key('profileRole')),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          key: const Key('profileLogoutButton'),
          onPressed: controller.isBusy ? null : controller.signOut,
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
        ),
      ],
    );
  }

  String _initials(String name) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .toList();
    if (parts.isEmpty) return '?';
    return parts.map((part) => part[0].toUpperCase()).join();
  }
}
