import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../models/dashboard_state.dart';
import '../platform/external_link_platform.dart';

class DashboardFeatureSections extends StatelessWidget {
  const DashboardFeatureSections({
    required this.content,
    required this.openUpdates,
    required this.openQuickLinks,
    required this.openAnnouncement,
    super.key,
  });

  final DashboardContent content;
  final VoidCallback openUpdates;
  final VoidCallback openQuickLinks;
  final ValueChanged<DashboardAnnouncement> openAnnouncement;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      if (content.announcementsStatus != DashboardSectionStatus.disabled) ...[
        _AnnouncementsCard(
          content: content,
          openUpdates: openUpdates,
          openAnnouncement: openAnnouncement,
        ),
        const SizedBox(height: 12),
      ],
      if (content.todayStatus != DashboardSectionStatus.disabled) ...[
        _TodayCard(content: content),
        const SizedBox(height: 12),
      ],
      if (content.quickLinksStatus != DashboardSectionStatus.disabled) ...[
        _QuickLinksCard(content: content, openQuickLinks: openQuickLinks),
        const SizedBox(height: 12),
      ],
    ],
  );
}

class _AnnouncementsCard extends StatelessWidget {
  const _AnnouncementsCard({
    required this.content,
    required this.openUpdates,
    required this.openAnnouncement,
  });

  final DashboardContent content;
  final VoidCallback openUpdates;
  final ValueChanged<DashboardAnnouncement> openAnnouncement;

  @override
  Widget build(BuildContext context) {
    final announcements = content.announcements.take(2).toList();
    return Card(
      key: const Key('homeAnnouncementsCard'),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionHeader(
              icon: Icons.campaign_outlined,
              title: 'Announcements',
              actionLabel: 'View updates',
              onAction: openUpdates,
            ),
            const SizedBox(height: 10),
            if (content.announcementsStatus == DashboardSectionStatus.error)
              const _SectionMessage(
                key: Key('homeAnnouncementsError'),
                text: 'Announcements are temporarily unavailable.',
                isError: true,
              )
            else if (announcements.isEmpty)
              const _SectionMessage(
                key: Key('homeAnnouncementsEmpty'),
                text: 'No announcements available right now.',
              )
            else
              ...announcements.map(
                (announcement) => ListTile(
                  key: Key('homeAnnouncement-${announcement.id}'),
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    child: Icon(Icons.notifications_none),
                  ),
                  title: Text(announcement.title),
                  subtitle: Text(
                    announcement.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => openAnnouncement(announcement),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TodayCard extends StatelessWidget {
  const _TodayCard({required this.content});

  final DashboardContent content;

  @override
  Widget build(BuildContext context) {
    final today = content.today;
    return Card(
      key: const Key('homeTodayCard'),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionHeader(
              icon: Icons.celebration_outlined,
              title: 'Today',
            ),
            const SizedBox(height: 10),
            if (content.todayStatus == DashboardSectionStatus.error)
              const _SectionMessage(
                key: Key('homeTodayError'),
                text: 'Today’s calendar is temporarily unavailable.',
                isError: true,
              )
            else if (today == null)
              const _SectionMessage(
                key: Key('homeTodayEmpty'),
                text: 'No celebration or holiday information is available.',
              )
            else ...[
              if (today.status != 'working_day')
                ListTile(
                  key: const Key('homeHolidayItem'),
                  contentPadding: EdgeInsets.zero,
                  leading: const CircleAvatar(
                    child: Icon(Icons.calendar_month_outlined),
                  ),
                  title: Text(today.title),
                  subtitle: Text(_statusLabel(today.status)),
                ),
              ...today.celebrations.map(
                (celebration) => ListTile(
                  key: Key('homeCelebration-${celebration.type}'),
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    child: Icon(
                      celebration.type == 'birthday'
                          ? Icons.cake_outlined
                          : Icons.workspace_premium_outlined,
                    ),
                  ),
                  title: Text(celebration.title),
                  subtitle: celebration.yearsCompleted != null
                      ? Text('${celebration.yearsCompleted} years completed')
                      : null,
                ),
              ),
              if (today.status == 'working_day' && today.celebrations.isEmpty)
                const _SectionMessage(
                  key: Key('homeTodayNoEvents'),
                  text: 'No celebrations or holidays today.',
                ),
            ],
          ],
        ),
      ),
    );
  }

  String _statusLabel(String status) => switch (status) {
    'optional_holiday' => 'Optional holiday',
    'holiday' => 'Holiday',
    _ => 'Working day',
  };
}

class _QuickLinksCard extends StatelessWidget {
  const _QuickLinksCard({required this.content, required this.openQuickLinks});

  final DashboardContent content;
  final VoidCallback openQuickLinks;

  @override
  Widget build(BuildContext context) => Card(
    key: const Key('homeQuickLinksCard'),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(
            icon: Icons.link,
            title: 'Quick Resource Links',
            actionLabel: 'View all',
            onAction: openQuickLinks,
          ),
          const SizedBox(height: 10),
          if (content.quickLinksStatus == DashboardSectionStatus.error)
            const _SectionMessage(
              key: Key('homeQuickLinksError'),
              text: 'Quick Links are temporarily unavailable.',
              isError: true,
            )
          else if (content.quickLinks.isEmpty)
            const _SectionMessage(
              key: Key('homeQuickLinksEmpty'),
              text: 'No Quick Links are available for you.',
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: content.quickLinks
                  .take(4)
                  .map(
                    (link) => ActionChip(
                      avatar: Icon(_quickLinkIcon(link), size: 18),
                      label: Text(link.title),
                      onPressed: openQuickLinks,
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    ),
  );
}

class UpdatesScreen extends StatelessWidget {
  const UpdatesScreen({required this.controller, super.key});

  final SessionController controller;

  @override
  Widget build(BuildContext context) {
    final content =
        controller.dashboard?.content ?? const DashboardContent.empty();
    return RefreshIndicator(
      onRefresh: controller.loadDashboard,
      child: ListView(
        key: const Key('updatesScreen'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Text('Updates', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          if (content.notificationsStatus != DashboardSectionStatus.disabled)
            _NotificationList(content: content, onNotificationTap: controller.markNotificationRead),
          if (content.notificationsStatus != DashboardSectionStatus.disabled &&
              content.announcementsStatus != DashboardSectionStatus.disabled)
            const SizedBox(height: 12),
          if (content.announcementsStatus != DashboardSectionStatus.disabled)
            _AnnouncementList(content: content),
        ],
      ),
    );
  }
}

class _NotificationList extends StatelessWidget {
  const _NotificationList({required this.content, required this.onNotificationTap});
  final DashboardContent content;
  final Future<bool> Function(String id) onNotificationTap;

  @override
  Widget build(BuildContext context) => Card(
    key: const Key('notificationsCard'),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SectionHeader(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            badge: content.unreadNotificationCount,
          ),
          const SizedBox(height: 10),
          if (content.notificationsStatus == DashboardSectionStatus.error)
            const _SectionMessage(
              key: Key('notificationsError'),
              text: 'Notifications are temporarily unavailable.',
              isError: true,
            )
          else if (content.notifications.isEmpty)
            const _SectionMessage(
              key: Key('notificationsEmpty'),
              text: 'You’re all caught up.',
            )
          else
            ...content.notifications.map(
              (notification) => ListTile(
                key: Key('notification-${notification.id}'),
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  notification.isRead
                      ? Icons.mark_email_read_outlined
                      : Icons.mark_email_unread_outlined,
                ),
                title: Text(notification.title),
                subtitle: Text(notification.message),
                trailing: notification.isRead
                    ? const Text('Read')
                    : const Badge(label: Text('New')),
                onTap: notification.isRead ? null : () => onNotificationTap(notification.id),
              ),
            ),
        ],
      ),
    ),
  );
}

class _AnnouncementList extends StatelessWidget {
  const _AnnouncementList({required this.content});
  final DashboardContent content;

  @override
  Widget build(BuildContext context) => Card(
    key: const Key('announcementsCard'),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _SectionHeader(
            icon: Icons.campaign_outlined,
            title: 'Announcements',
          ),
          const SizedBox(height: 10),
          if (content.announcementsStatus == DashboardSectionStatus.error)
            const _SectionMessage(
              key: Key('announcementsError'),
              text: 'Announcements are temporarily unavailable.',
              isError: true,
            )
          else if (content.announcements.isEmpty)
            const _SectionMessage(
              key: Key('announcementsEmpty'),
              text: 'No announcements available right now.',
            )
          else
            ...content.announcements.map(
              (announcement) => ListTile(
                key: Key('announcement-${announcement.id}'),
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.campaign_outlined),
                title: Text(announcement.title),
                subtitle: Text(
                  announcement.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => showAnnouncementDetails(context, announcement),
              ),
            ),
        ],
      ),
    ),
  );
}

class QuickLinksScreen extends StatelessWidget {
  const QuickLinksScreen({
    required this.controller,
    required this.linkPlatform,
    super.key,
  });

  final SessionController controller;
  final ExternalLinkPlatform linkPlatform;

  @override
  Widget build(BuildContext context) {
    final content =
        controller.dashboard?.content ?? const DashboardContent.empty();
    return RefreshIndicator(
      onRefresh: controller.loadDashboard,
      child: ListView(
        key: const Key('quickLinksScreen'),
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Text(
            'Quick Resource Links',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 16),
          if (content.quickLinksStatus == DashboardSectionStatus.error)
            const _SectionMessage(
              key: Key('quickLinksError'),
              text: 'Quick Links are temporarily unavailable.',
              isError: true,
            )
          else if (content.quickLinks.isEmpty)
            const _SectionMessage(
              key: Key('quickLinksEmpty'),
              text: 'No Quick Links are available for you.',
            )
          else
            ...content.quickLinks.map(
              (link) => Card(
                child: ListTile(
                  key: Key('quickLink-${link.id}'),
                  leading: _QuickLinkVisual(link: link),
                  title: Text(link.title),
                  subtitle: Text(
                    [
                      link.categoryName,
                      link.description,
                    ].where((value) => value.isNotEmpty).join(' • '),
                  ),
                  trailing: link.url == null
                      ? const Icon(Icons.lock_outline)
                      : const Icon(Icons.open_in_new),
                  enabled: link.url != null,
                  onTap: link.url == null
                      ? null
                      : () => _openLink(context, link.url!),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _openLink(BuildContext context, String url) async {
    final opened = await linkPlatform.open(url);
    if (!context.mounted || opened) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Unable to open this link right now.')),
    );
  }
}

class _QuickLinkVisual extends StatelessWidget {
  const _QuickLinkVisual({required this.link});
  final DashboardQuickLink link;

  @override
  Widget build(BuildContext context) {
    final thumbnail = link.thumbnailUrl;
    if (thumbnail != null && thumbnail.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Image.network(
          thumbnail,
          width: 44,
          height: 44,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) =>
              const CircleAvatar(child: Icon(Icons.link)),
        ),
      );
    }
    return CircleAvatar(child: Icon(_quickLinkIcon(link)));
  }
}

IconData _quickLinkIcon(DashboardQuickLink link) {
  final icon = link.icon?.toLowerCase();
  return switch (icon) {
    'book' || 'book-open' => Icons.menu_book_outlined,
    'file' || 'file-text' || 'pdf' => Icons.description_outlined,
    'calendar' => Icons.calendar_month_outlined,
    'graduation-cap' || 'training' => Icons.school_outlined,
    'video' => Icons.play_circle_outline,
    'users' => Icons.groups_outlined,
    'star' => Icons.star_outline,
    _ => link.isFeatured ? Icons.star_outline : Icons.link,
  };
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({
    required this.icon,
    required this.title,
    this.actionLabel,
    this.onAction,
    this.badge = 0,
  });

  final IconData icon;
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  final int badge;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          title,
          style: Theme.of(context).textTheme.titleMedium
              ?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      if (badge > 0) Badge.count(count: badge > 99 ? 99 : badge),
      if (actionLabel != null)
        TextButton(onPressed: onAction, child: Text(actionLabel!)),
    ],
  );
}

class _SectionMessage extends StatelessWidget {
  const _SectionMessage({required this.text, this.isError = false, super.key});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 8),
    child: Text(
      text,
      style: TextStyle(
        color: isError
            ? Theme.of(context).colorScheme.error
            : Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    ),
  );
}

Future<void> showAnnouncementDetails(
  BuildContext context,
  DashboardAnnouncement announcement,
) => showModalBottomSheet<void>(
  context: context,
  showDragHandle: true,
  isScrollControlled: true,
  builder: (context) => SafeArea(
    child: SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 4, 24, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            announcement.title,
            key: const Key('announcementDetailTitle'),
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          Text(
            announcement.description.isEmpty
                ? 'No content provided.'
                : announcement.description,
          ),
        ],
      ),
    ),
  ),
);
