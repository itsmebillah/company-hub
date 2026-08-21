import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({required this.controller, super.key});

  final SessionController controller;

  @override
  Widget build(BuildContext context) {
    final profile = controller.session!.profile;
    final state = controller.attendance;
    final busy = controller.isBusy;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance'),
        actions: [
          IconButton(
            key: const Key('logoutButton'),
            tooltip: 'Sign out',
            onPressed: busy ? null : controller.signOut,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: controller.reconcile,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                profile.name,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              Text('${profile.employeeId} • ${profile.roleName}'),
              const SizedBox(height: 24),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Today',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 12),
                      if (controller.phase == SessionPhase.reconciling)
                        const Row(
                          key: Key('reconcilingState'),
                          children: [
                            SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Confirming authoritative attendance…',
                              ),
                            ),
                          ],
                        )
                      else
                        Text(
                          state?.attendance?.isCheckedOut == true
                              ? 'Checked out'
                              : state?.attendance?.isCheckedIn == true
                              ? 'Checked in'
                              : 'Not checked in',
                          key: const Key('attendanceStatus'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      if (controller.errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          controller.errorMessage!,
                          key: const Key('attendanceError'),
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ],
                      const SizedBox(height: 20),
                      if (state?.canCheckIn == true)
                        FilledButton.icon(
                          key: const Key('checkInButton'),
                          onPressed: busy ? null : controller.checkIn,
                          icon: const Icon(Icons.login),
                          label: const Text('Check in'),
                        ),
                      if (state?.canCheckOut == true)
                        FilledButton.icon(
                          key: const Key('checkOutButton'),
                          onPressed: busy ? null : controller.checkOut,
                          icon: const Icon(Icons.logout),
                          label: const Text('Check out'),
                        ),
                      if (state == null && !busy)
                        OutlinedButton.icon(
                          onPressed: controller.reconcile,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
