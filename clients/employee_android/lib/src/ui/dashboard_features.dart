import 'dart:async';

import 'package:flutter/material.dart';

import '../controllers/session_controller.dart';
import '../models/dashboard_state.dart';
import '../platform/external_link_platform.dart';
import '../storage/resource_pin_storage.dart';

class DashboardFeatureSections extends StatelessWidget {
  const DashboardFeatureSections({
    required this.content,
    required this.employeeId,
    required this.openUpdates,
    required this.openQuickLinks,
    required this.openAnnouncement,
    super.key,
  });

  final DashboardContent content;
  final String employeeId;
  final VoidCallback openUpdates;
  final VoidCallback openQuickLinks;
  final ValueChanged<DashboardAnnouncement> openAnnouncement;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      if (content.announcementsStatus != DashboardSectionStatus.disabled &&
          content.announcements.isNotEmpty) ...[
        _AnnouncementsCard(
          content: content,
          openAnnouncement: openAnnouncement,
        ),
        const SizedBox(height: 12),
      ],
      if (content.todayStatus != DashboardSectionStatus.disabled &&
          content.today != null &&
          (content.today!.status != 'working_day' ||
              content.today!.celebrations.isNotEmpty)) ...[
        _TodayCard(content: content),
        const SizedBox(height: 12),
      ],
      if (content.quickLinksStatus != DashboardSectionStatus.disabled &&
          content.quickLinks.isNotEmpty) ...[
        _QuickLinksCard(
          content: content,
          employeeId: employeeId,
          openQuickLinks: openQuickLinks,
        ),
        const SizedBox(height: 12),
      ],
    ],
  );
}

class _AnnouncementsCard extends StatefulWidget {
  const _AnnouncementsCard({
    required this.content,
    required this.openAnnouncement,
  });

  final DashboardContent content;
  final ValueChanged<DashboardAnnouncement> openAnnouncement;

  @override
  State<_AnnouncementsCard> createState() => _AnnouncementsCardState();
}

class _AnnouncementsCardState extends State<_AnnouncementsCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _tickerController;
  int _announcementIndex = 0;
  Timer? _tickerRestart;

  @override
  void initState() {
    super.initState();
    _tickerController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    );
    if (widget.content.announcements.length > 1) {
      _tickerController.addStatusListener(_advanceTicker);
      _tickerRestart = Timer(const Duration(seconds: 1), _startTicker);
    }
  }

  void _startTicker() {
    if (mounted) _tickerController.forward(from: 0);
  }

  void _advanceTicker(AnimationStatus status) {
    if (status != AnimationStatus.completed || !mounted) return;
    setState(() {
      _announcementIndex =
          (_announcementIndex + 1) % widget.content.announcements.length;
    });
    _tickerRestart = Timer(const Duration(seconds: 1), _startTicker);
  }

  @override
  void dispose() {
    _tickerRestart?.cancel();
    _tickerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final announcements = [...widget.content.announcements]
      ..sort(
        (a, b) =>
            _priorityRank(b.priority).compareTo(_priorityRank(a.priority)),
      );
    final isTicker = announcements.length > 1;
    final announcement =
        announcements[_announcementIndex % announcements.length];
    return Card(
      key: const Key('homeAnnouncementsCard'),
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child:
            widget.content.announcementsStatus == DashboardSectionStatus.error
            ? const _SectionMessage(
                key: Key('homeAnnouncementsError'),
                text: 'Announcements are temporarily unavailable.',
                isError: true,
              )
            : ClipRect(
                child: isTicker
                    ? AnimatedBuilder(
                        animation: _tickerController,
                        builder: (context, child) => FractionalTranslation(
                          translation: Offset(
                            _tickerController.value * 2 - 1,
                            0,
                          ),
                          child: child,
                        ),
                        child: _FeaturedAnnouncement(
                          announcement: announcement,
                          onTap: () => widget.openAnnouncement(announcement),
                        ),
                      )
                    : _FeaturedAnnouncement(
                        announcement: announcement,
                        onTap: () => widget.openAnnouncement(announcement),
                      ),
              ),
      ),
    );
  }
}

int _priorityRank(String priority) {
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
      return 2;
    case 'medium':
      return 1;
    default:
      return 0;
  }
}

class _FeaturedAnnouncement extends StatelessWidget {
  const _FeaturedAnnouncement({
    required this.announcement,
    required this.onTap,
  });

  final DashboardAnnouncement announcement;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = _announcementAccent(context, announcement.priority);
    return Padding(
      padding: EdgeInsets.zero,
      child: InkWell(
        key: Key('homeAnnouncement-${announcement.id}'),
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: accent.withValues(alpha: 0.42)),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 88,
                height: 110,
                child: _AnnouncementVisual(announcement: announcement),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 14,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        announcement.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color:
                                  announcement.priority.toLowerCase() == 'high'
                                  ? accent
                                  : null,
                            ),
                      ),
                      if (announcement.description.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          announcement.description,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Icon(Icons.chevron_right, color: accent),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

Color _announcementAccent(BuildContext context, String priority) {
  final colors = Theme.of(context).colorScheme;
  switch (priority.toLowerCase()) {
    case 'important':
    case 'urgent':
      return colors.error;
    case 'warning':
      return Colors.orange.shade700;
    case 'birthday':
    case 'wish':
      return Colors.pink.shade600;
    case 'holiday':
      return Colors.teal.shade600;
    case 'event':
      return Colors.deepPurple.shade500;
    case 'update':
      return colors.primary;
    case 'success':
      return Colors.green.shade700;
    default:
      return colors.primary;
  }
}

class _AnnouncementVisual extends StatelessWidget {
  const _AnnouncementVisual({required this.announcement});

  final DashboardAnnouncement announcement;

  @override
  Widget build(BuildContext context) {
    final url = announcement.bannerUrl;
    if (url != null && url.isNotEmpty) {
      return ClipRRect(
        borderRadius: const BorderRadius.horizontal(left: Radius.circular(18)),
        child: Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const _AnnouncementFallback(),
        ),
      );
    }
    return const _AnnouncementFallback();
  }
}

class _AnnouncementFallback extends StatelessWidget {
  const _AnnouncementFallback();

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: Theme.of(context).colorScheme.primaryContainer,
    child: Icon(
      Icons.campaign_outlined,
      color: Theme.of(context).colorScheme.onPrimaryContainer,
      size: 30,
    ),
  );
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
            else if (today != null) ...[
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
  const _QuickLinksCard({
    required this.content,
    required this.employeeId,
    required this.openQuickLinks,
  });

  final DashboardContent content;
  final String employeeId;
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
          const SizedBox(height: 12),
          if (content.quickLinksStatus == DashboardSectionStatus.error)
            const _SectionMessage(
              key: Key('homeQuickLinksError'),
              text: 'Quick Links are temporarily unavailable.',
              isError: true,
            )
          else
            _QuickLinksGrid(
              content: content,
              employeeId: employeeId,
              linkPlatform: const MethodChannelExternalLinkPlatform(),
              maxItems: 4,
            ),
        ],
      ),
    ),
  );
}

class _QuickLinksGrid extends StatefulWidget {
  const _QuickLinksGrid({
    required this.content,
    required this.employeeId,
    required this.linkPlatform,
    this.maxItems,
  });

  final DashboardContent content;
  final String employeeId;
  final ExternalLinkPlatform linkPlatform;
  final int? maxItems;

  @override
  State<_QuickLinksGrid> createState() => _QuickLinksGridState();
}

class _QuickLinksGridState extends State<_QuickLinksGrid> {
  final ResourcePinStorage _pinStorage = SecureResourcePinStorage();
  Set<String> _pinned = <String>{};
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _loadPins();
  }

  Future<void> _loadPins() async {
    final pins = await _pinStorage
        .read(widget.employeeId)
        .timeout(
          const Duration(milliseconds: 250),
          onTimeout: () => <String>{},
        );
    if (mounted) {
      setState(() {
        _pinned = pins;
        _loaded = true;
      });
    }
  }

  Future<void> _togglePin(DashboardQuickLink link) async {
    final next = {..._pinned};
    if (!next.add(link.id)) next.remove(link.id);
    setState(() => _pinned = next);
    await _pinStorage.write(widget.employeeId, next);
  }

  List<DashboardQuickLink> get _ordered {
    final links = [...widget.content.quickLinks];
    links.sort((a, b) {
      final pin =
          (_pinned.contains(b.id) ? 1 : 0) - (_pinned.contains(a.id) ? 1 : 0);
      if (pin != 0) return pin;
      if (a.isFeatured != b.isFeatured) return a.isFeatured ? -1 : 1;
      return a.title.toLowerCase().compareTo(b.title.toLowerCase());
    });
    return widget.maxItems == null
        ? links
        : links.take(widget.maxItems!).toList();
  }

  @override
  Widget build(BuildContext context) {
    if (!_loaded && widget.content.quickLinks.isNotEmpty) {
      return const SizedBox(
        height: 120,
        child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }
    final links = _ordered;
    if (links.isEmpty) {
      return const _SectionMessage(
        key: Key('homeQuickLinksEmpty'),
        text: 'No Quick Links are available for you.',
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = constraints.maxWidth >= 520 ? 3 : 2;
        return GridView.builder(
          key: const Key('quickLinksGrid'),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: links.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: columns,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.92,
          ),
          itemBuilder: (context, index) => _QuickLinkCard(
            key: Key('quickLink-${links[index].id}'),
            link: links[index],
            pinned: _pinned.contains(links[index].id),
            onTogglePin: () => _togglePin(links[index]),
            linkPlatform: widget.linkPlatform,
          ),
        );
      },
    );
  }
}

class _QuickLinkCard extends StatelessWidget {
  const _QuickLinkCard({
    required this.link,
    required this.pinned,
    required this.onTogglePin,
    required this.linkPlatform,
    super.key,
  });

  final DashboardQuickLink link;
  final bool pinned;
  final VoidCallback onTogglePin;
  final ExternalLinkPlatform linkPlatform;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.55),
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: link.url == null ? null : () => _openLink(context, link.url!),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _QuickLinkThumbnail(link: link),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: IconButton(
                      key: Key('pin-${link.id}'),
                      visualDensity: VisualDensity.compact,
                      style: IconButton.styleFrom(
                        backgroundColor: theme.colorScheme.surface.withValues(
                          alpha: 0.9,
                        ),
                      ),
                      icon: Icon(
                        pinned ? Icons.push_pin : Icons.push_pin_outlined,
                        size: 18,
                      ),
                      tooltip: pinned ? 'Unpin resource' : 'Pin resource',
                      onPressed: onTogglePin,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 8, 8),
                child: Text(
                  link.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ],
        ),
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

class _QuickLinkThumbnail extends StatelessWidget {
  const _QuickLinkThumbnail({required this.link});
  final DashboardQuickLink link;

  @override
  Widget build(BuildContext context) {
    final thumbnail = link.thumbnailUrl;
    if (thumbnail != null && thumbnail.isNotEmpty) {
      return Image.network(
        thumbnail,
        fit: BoxFit.cover,
        errorBuilder: (_, _, _) => _QuickLinkFallback(link: link),
      );
    }
    return _QuickLinkFallback(link: link);
  }
}

class _QuickLinkFallback extends StatelessWidget {
  const _QuickLinkFallback({required this.link});
  final DashboardQuickLink link;

  @override
  Widget build(BuildContext context) => ColoredBox(
    color: Theme.of(context).colorScheme.primaryContainer,
    child: Center(child: Icon(_quickLinkIcon(link), size: 32)),
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
            _NotificationList(
              content: content,
              onNotificationTap: controller.markNotificationRead,
            ),
          if (content.notificationsStatus != DashboardSectionStatus.disabled &&
              content.announcementsStatus != DashboardSectionStatus.disabled)
            const SizedBox(height: 12),
          if (content.announcementsStatus != DashboardSectionStatus.disabled)
            _AnnouncementList(content: content),
          if (content.notificationsStatus == DashboardSectionStatus.disabled &&
              content.announcementsStatus == DashboardSectionStatus.disabled)
            const _SectionMessage(
              key: Key('updatesUnavailable'),
              text: 'No update channels are currently available.',
            ),
        ],
      ),
    );
  }
}

class _NotificationList extends StatelessWidget {
  const _NotificationList({
    required this.content,
    required this.onNotificationTap,
  });
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
                onTap: notification.isRead
                    ? null
                    : () => onNotificationTap(notification.id),
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
    final employeeId = controller.session?.profile.employeeId ?? 'unknown';
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
          else
            _QuickLinksGrid(
              content: content,
              employeeId: employeeId,
              linkPlatform: linkPlatform,
            ),
        ],
      ),
    );
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
