import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../models/attendance_state.dart';
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
          _AttendanceSummaryCard(
            controller: controller,
            openAttendance: openAttendance,
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
}

class _AttendanceSummaryCard extends StatelessWidget {
  const _AttendanceSummaryCard({
    required this.controller,
    required this.openAttendance,
  });

  final SessionController controller;
  final VoidCallback openAttendance;

  @override
  Widget build(BuildContext context) {
    final state = controller.attendance;
    final record = state?.attendance;
    final status = _statusLabel(controller.phase, state);
    final statusIcon = _statusIcon(controller.phase, state);
    final isError = controller.errorMessage != null;

    return Card(
      key: const Key('homeAttendanceCard'),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: Theme.of(context)
                      .colorScheme
                      .primaryContainer,
                  foregroundColor: Theme.of(context)
                      .colorScheme
                      .onPrimaryContainer,
                  child: Icon(statusIcon),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Today's Attendance",
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Manual check-in status',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _AttendanceStatusPill(label: status),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              'Attendance date: ${state?.attendanceDate ?? '--'}',
              key: const Key('homeAttendanceDate'),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (isError) ...[
              const SizedBox(height: 8),
              Text(
                controller.errorMessage!,
                key: const Key('homeAttendanceError'),
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _AttendanceMetricTile(
                    icon: Icons.login,
                    label: 'Check-in',
                    value: _formatTime(record?.checkIn),
                    valueKey: const Key('homeAttendanceCheckIn'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _AttendanceMetricTile(
                    icon: Icons.logout,
                    label: 'Check-out',
                    value: _formatTime(record?.checkOut),
                    valueKey: const Key('homeAttendanceCheckOut'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _AttendanceMetricTile(
                    icon: Icons.timer_outlined,
                    label: 'Hours',
                    value: _formatDuration(record?.workingMinutes ?? 0),
                    valueKey: const Key('homeAttendanceHours'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              key: const Key('openAttendanceButton'),
              onPressed: openAttendance,
              icon: const Icon(Icons.schedule),
              label: const Text('Open Attendance'),
            ),
          ],
        ),
      ),
    );
  }

  String _statusLabel(SessionPhase phase, AttendanceState? state) {
    if (phase == SessionPhase.reconciling && state == null) {
      return 'Loading';
    }
    if (phase == SessionPhase.acquiringLocation) {
      return 'Getting GPS';
    }
    final record = state?.attendance;
    if (record?.isCheckedOut == true) return 'Checked out';
    if (record?.isCheckedIn == true) return 'Checked in';
    return 'Not started';
  }

  IconData _statusIcon(SessionPhase phase, AttendanceState? state) {
    if (phase == SessionPhase.reconciling && state == null) {
      return Icons.sync;
    }
    if (phase == SessionPhase.acquiringLocation) {
      return Icons.my_location;
    }
    final record = state?.attendance;
    if (record?.isCheckedOut == true) return Icons.task_alt;
    if (record?.isCheckedIn == true) return Icons.location_on;
    return Icons.pending_actions;
  }

  String _formatTime(String? value) {
    if (value == null || value.trim().isEmpty) return '--';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    final local = parsed.toLocal();
    final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
    final minute = local.minute.toString().padLeft(2, '0');
    final period = local.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  String _formatDuration(int minutes) {
    if (minutes <= 0) return '--';
    final hours = minutes ~/ 60;
    final remainder = minutes % 60;
    return hours > 0 ? '${hours}h ${remainder}m' : '$minutes min';
  }
}

class _AttendanceStatusPill extends StatelessWidget {
  const _AttendanceStatusPill({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(999),
        color: colorScheme.surfaceContainerHighest.withValues(alpha: 0.55),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          label,
          key: const Key('homeAttendanceStatus'),
          style: Theme.of(context).textTheme.labelSmall
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

class _AttendanceMetricTile extends StatelessWidget {
  const _AttendanceMetricTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.valueKey,
  });

  final IconData icon;
  final String label;
  final String value;
  final Key valueKey;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: colorScheme.onSurfaceVariant),
            const SizedBox(height: 8),
            Text(label, style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 4),
            Text(
              value,
              key: valueKey,
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
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
