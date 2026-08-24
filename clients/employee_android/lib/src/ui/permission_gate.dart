import 'package:flutter/material.dart';

import '../tracking/tracking_controller.dart';
import '../tracking/tracking_platform.dart';

class PermissionGate extends StatelessWidget {
  const PermissionGate({required this.controller, super.key});

  final TrackingController controller;

  @override
  Widget build(BuildContext context) {
    if (!controller.permissionsInitialized) {
      return const Scaffold(
        body: SafeArea(child: Center(child: CircularProgressIndicator())),
      );
    }

    final status = controller.status;
    final content = _contentFor(status);
    final permanentlyDenied = status.isPermanentlyDenied;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(content.icon, size: 72),
                  const SizedBox(height: 24),
                  Text(
                    content.title,
                    key: const Key('permissionGateTitle'),
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    content.explanation,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Company Hub does not request background location, camera, or photo-library access.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 28),
                  if (permanentlyDenied)
                    FilledButton.icon(
                      key: const Key('openPermissionSettingsButton'),
                      onPressed: controller.permissionOperationInProgress
                          ? null
                          : controller.openAppSettings,
                      icon: const Icon(Icons.settings),
                      label: const Text('Open Settings'),
                    )
                  else
                    FilledButton.icon(
                      key: const Key('requestPermissionButton'),
                      onPressed: controller.permissionOperationInProgress
                          ? null
                          : controller.requestRequiredPermissions,
                      icon: const Icon(Icons.security),
                      label: Text(
                        status.state == TrackingState.permissionRequired ||
                                status.state ==
                                    TrackingState.notificationRequired
                            ? 'Continue'
                            : 'Try Again',
                      ),
                    ),
                  if (controller.permissionOperationInProgress) ...[
                    const SizedBox(height: 16),
                    const Center(child: CircularProgressIndicator()),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  _PermissionContent _contentFor(TrackingStatus status) =>
      switch (status.state) {
        TrackingState.notificationRequired => const _PermissionContent(
          title: 'Allow notifications',
          explanation: 'Notifications keep the required foreground tracking disclosure visible while an active attendance session is being tracked.',
          icon: Icons.notifications_active_outlined,
        ),
        TrackingState.unavailable => const _PermissionContent(
          title: 'Location is unavailable',
          explanation: 'This device must support precise location before attendance and active-duty tracking can be used.',
          icon: Icons.location_disabled_outlined,
        ),
        TrackingState.error => const _PermissionContent(
          title: 'Permission status unavailable',
          explanation: 'Company Hub could not verify Android permission status. Try again before continuing.',
          icon: Icons.error_outline,
        ),
        _ => _PermissionContent(
          title: status.isPermanentlyDenied
              ? 'Enable precise location in Settings'
              : 'Allow precise location',
          explanation: 'Precise location is required to verify attendance and collect duty-bound location points only while an authoritative attendance session is active.',
          icon: Icons.location_on_outlined,
        ),
      };
}

class _PermissionContent {
  const _PermissionContent({
    required this.title,
    required this.explanation,
    required this.icon,
  });

  final String title;
  final String explanation;
  final IconData icon;
}
