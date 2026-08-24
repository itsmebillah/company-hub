import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../tracking/tracking_controller.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    required this.controller,
    required this.trackingController,
    required this.openAttendance,
    required this.openProfile,
    super.key,
  });

  final SessionController controller;
  final TrackingController trackingController;
  final VoidCallback openAttendance;
  final VoidCallback openProfile;

  @override
  Widget build(BuildContext context) {
    final profile = controller.session!.profile;
    final attendance = controller.attendance;
    final record = attendance?.attendance;
    final status = record?.isCheckedOut == true
        ? 'Checked out'
        : record?.isCheckedIn == true
        ? 'Checked in'
        : 'Not checked in';
    final statusIcon = record?.isCheckedOut == true
        ? Icons.task_alt
        : record?.isCheckedIn == true
        ? Icons.location_on
        : Icons.pending_actions;

    return RefreshIndicator(
      onRefresh: controller.reconcile,
      child: ListView(
        key: const Key('homeScreen'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Text(
            'Welcome, ${profile.name}',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 4),
          Text('${profile.employeeId} \u2022 ${profile.roleName}'),
          const SizedBox(height: 20),
          Card(
            key: const Key('homeAttendanceCard'),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(statusIcon),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Today's attendance",
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            Text(
                              status,
                              key: const Key('homeAttendanceStatus'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (attendance != null) ...[
                    const SizedBox(height: 12),
                    Text('Attendance date: ${attendance.attendanceDate}'),
                  ],
                  if (record?.workingMinutes case final minutes?) ...[
                    const SizedBox(height: 4),
                    Text('Recorded work: ${_duration(minutes)}'),
                  ],
                  const SizedBox(height: 16),
                  FilledButton.icon(
                    key: const Key('openAttendanceButton'),
                    onPressed: openAttendance,
                    icon: const Icon(Icons.schedule),
                    label: const Text('Open attendance'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ListenableBuilder(
            listenable: trackingController,
            builder: (context, _) => Card(
              child: ListTile(
                leading: Icon(
                  trackingController.status.isActive
                      ? Icons.location_on
                      : Icons.location_off,
                ),
                title: Text(
                  trackingController.status.isActive
                      ? 'Duty tracking active'
                      : 'Duty tracking inactive',
                  key: const Key('homeTrackingStatus'),
                ),
                subtitle: const Text(
                  'Tracking follows the authoritative attendance session.',
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: ListTile(
              key: const Key('openProfileButton'),
              leading: const Icon(Icons.badge_outlined),
              title: const Text('Employee profile'),
              subtitle: const Text('View your verified account information.'),
              trailing: const Icon(Icons.chevron_right),
              onTap: openProfile,
            ),
          ),
        ],
      ),
    );
  }

  String _duration(int minutes) {
    final hours = minutes ~/ 60;
    final remainder = minutes % 60;
    return '${hours}h ${remainder}m';
  }
}
