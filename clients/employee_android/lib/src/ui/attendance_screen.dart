import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../tracking/tracking_controller.dart';
import '../tracking/tracking_platform.dart';

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({
    required this.controller,
    required this.trackingController,
    super.key,
  });

  final SessionController controller;
  final TrackingController trackingController;

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
                      else if (controller.phase ==
                          SessionPhase.acquiringLocation)
                        const Row(
                          key: Key('acquiringLocationState'),
                          children: [
                            SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(width: 12),
                            Expanded(child: Text('Getting a fresh GPS fix…')),
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
              if (state?.tracking.status == 'active') ...[
                const SizedBox(height: 16),
                ListenableBuilder(
                  listenable: trackingController,
                  builder: (context, _) =>
                      _TrackingDisclosureCard(controller: trackingController),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _TrackingDisclosureCard extends StatelessWidget {
  const _TrackingDisclosureCard({required this.controller});

  final TrackingController controller;

  @override
  Widget build(BuildContext context) {
    final status = controller.status;
    final permissionAction = switch (status.state) {
      TrackingState.permissionRequired ||
      TrackingState.permissionDenied ||
      TrackingState.notificationRequired => true,
      _ => false,
    };
    return Card(
      key: const Key('trackingDisclosure'),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(status.isActive ? Icons.location_on : Icons.location_off),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    status.isActive
                        ? 'Duty tracking is active'
                        : 'Duty tracking is not active',
                    key: const Key('trackingDisclosureTitle'),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(_trackingMessage(status.state)),
            if (permissionAction) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                key: const Key('trackingPermissionButton'),
                onPressed: controller.requestRequiredPermissions,
                icon: const Icon(Icons.settings),
                label: const Text('Allow required permissions'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _trackingMessage(TrackingState state) => switch (state) {
    TrackingState.permissionRequired || TrackingState.permissionDenied => 'Precise location is required during an active duty session. No location points are created while permission is unavailable.',
    TrackingState.notificationRequired => 'Notification permission is required for the persistent tracking disclosure. Tracking remains stopped.',
    TrackingState.active => 'Duty tracking is active. Location points are securely queued and uploaded about every 30 minutes.',
    TrackingState.starting => 'Starting the visible duty-tracking service…',
    TrackingState.stopping => 'Stopping duty tracking…',
    TrackingState.suspended =>
      'Tracking is suspended until its required conditions are restored.',
    TrackingState.error =>
      'Tracking could not start. No location points are being created.',
    TrackingState.unavailable =>
      'Native duty tracking is unavailable on this device.',
    TrackingState.ready => 'Required permissions are ready.',
    TrackingState.stopped => 'Tracking is stopped.',
  };
}
