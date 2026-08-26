import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../models/dashboard_state.dart';
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
    final profile =
        controller.dashboard?.profile ??
        DashboardProfile.fromSession(controller.session!.profile);
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
      onRefresh: () async {
        await controller.loadDashboard();
        await controller.reconcile();
      },
      child: ListView(
        key: const Key('homeScreen'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          _DashboardHeader(
            profile: profile,
            isLoading: controller.isDashboardLoading,
            errorMessage: controller.dashboardErrorMessage,
          ),
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

class _DashboardHeader extends StatelessWidget {
  const _DashboardHeader({
    required this.profile,
    required this.isLoading,
    required this.errorMessage,
  });

  final DashboardProfile profile;
  final bool isLoading;
  final String? errorMessage;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final date = MaterialLocalizations.of(context)
        .formatMediumDate(DateTime.now());

    return Card(
      key: const Key('homeDashboardHeader'),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _ProfilePhoto(
                  photoUrl: profile.photoUrl,
                  employeeName: profile.name,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Employee Workspace',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Welcome, ${profile.name}',
                        key: const Key('homeWelcomeText'),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        profile.companyName,
                        key: const Key('homeCompanyName'),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            DecoratedBox(
              decoration: BoxDecoration(
                border: Border.all(color: colorScheme.outlineVariant),
                borderRadius: BorderRadius.circular(16),
                color: colorScheme.surfaceContainerHighest.withValues(
                  alpha: 0.35,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        date,
                        key: const Key('homeCurrentDate'),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                    Flexible(
                      child: Text(
                        profile.roleName,
                        key: const Key('homeRoleName'),
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                        style: Theme.of(context).textTheme.bodySmall
                            ?.copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'ID ${profile.employeeId}',
                        key: const Key('homeEmployeeId'),
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.end,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (isLoading || errorMessage != null) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (isLoading) ...[
                    const SizedBox.square(
                      dimension: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: Text(
                      isLoading
                          ? 'Refreshing dashboard profile...'
                          : 'Using saved profile. $errorMessage',
                      key: const Key('homeDashboardHeaderStatus'),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isLoading
                            ? colorScheme.onSurfaceVariant
                            : colorScheme.error,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProfilePhoto extends StatefulWidget {
  const _ProfilePhoto({required this.photoUrl, required this.employeeName});

  final String? photoUrl;
  final String employeeName;

  @override
  State<_ProfilePhoto> createState() => _ProfilePhotoState();
}

class _ProfilePhotoState extends State<_ProfilePhoto> {
  bool _hasImageError = false;

  @override
  void didUpdateWidget(covariant _ProfilePhoto oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.photoUrl != widget.photoUrl) {
      _hasImageError = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final photoUrl = widget.photoUrl;
    if (photoUrl != null && photoUrl.trim().isNotEmpty && !_hasImageError) {
      return ClipOval(
        child: Image.network(
          photoUrl,
          key: const Key('homeProfilePhoto'),
          width: 64,
          height: 64,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) setState(() => _hasImageError = true);
            });
            return _ProfilePhotoFallback(employeeName: widget.employeeName);
          },
        ),
      );
    }

    return _ProfilePhotoFallback(employeeName: widget.employeeName);
  }
}

class _ProfilePhotoFallback extends StatelessWidget {
  const _ProfilePhotoFallback({required this.employeeName});

  final String employeeName;

  @override
  Widget build(BuildContext context) {
    final initials = employeeName
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part.characters.first.toUpperCase())
        .join();

    return CircleAvatar(
      key: const Key('homeProfilePhotoFallback'),
      radius: 32,
      child: initials.isEmpty
          ? const Icon(Icons.person_outline)
          : Text(
              initials,
              style: Theme.of(context).textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
    );
  }
}
