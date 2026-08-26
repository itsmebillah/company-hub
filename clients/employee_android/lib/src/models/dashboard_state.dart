import 'auth_session.dart';

class DashboardFeatureFlag {
  const DashboardFeatureFlag({required this.key, required this.enabled});

  factory DashboardFeatureFlag.fromJson(Map<String, Object?> json) =>
      DashboardFeatureFlag(
        key: json.requireString('key'),
        enabled: json['enabled'] as bool? ?? false,
      );

  final String key;
  final bool enabled;
}

class DashboardProfile {
  const DashboardProfile({
    required this.employeeId,
    required this.name,
    required this.companyId,
    required this.roleName,
    required this.companyName,
    required this.photoUrl,
  });

  factory DashboardProfile.fromJson(Map<String, Object?> json) =>
      DashboardProfile(
        employeeId: json.requireString('employeeId'),
        name: json.requireString('name'),
        companyId: json.requireString('companyId'),
        roleName: json.requireString('roleName'),
        companyName: json.requireString('companyName'),
        photoUrl: json['photoUrl'] as String?,
      );

  factory DashboardProfile.fromSession(SessionProfile profile) =>
      DashboardProfile(
        employeeId: profile.employeeId,
        name: profile.name,
        companyId: profile.companyId,
        roleName: profile.roleName,
        companyName: 'Company Hub',
        photoUrl: null,
      );

  final String employeeId;
  final String name;
  final String companyId;
  final String roleName;
  final String companyName;
  final String? photoUrl;
}

enum DashboardSectionStatus {
  ready,
  disabled,
  error;

  static DashboardSectionStatus parse(Object? value) => switch (value) {
    'ready' => ready,
    'error' => error,
    _ => disabled,
  };
}

class DashboardQuickLink {
  const DashboardQuickLink({
    required this.id,
    required this.title,
    required this.description,
    required this.categoryName,
    required this.url,
    required this.icon,
    required this.thumbnailUrl,
    required this.openMode,
    required this.isFeatured,
  });

  factory DashboardQuickLink.fromJson(Map<String, Object?> json) =>
      DashboardQuickLink(
        id: json.requireString('id'),
        title: json.requireString('title'),
        description: json['description'] as String? ?? '',
        categoryName: json['categoryName'] as String? ?? '',
        url: json['url'] as String?,
        icon: json['icon'] as String?,
        thumbnailUrl: json['thumbnailUrl'] as String?,
        openMode: json['openMode'] as String? ?? 'external',
        isFeatured: json['isFeatured'] as bool? ?? false,
      );

  final String id;
  final String title;
  final String description;
  final String categoryName;
  final String? url;
  final String? icon;
  final String? thumbnailUrl;
  final String openMode;
  final bool isFeatured;
}

class DashboardNotification {
  const DashboardNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.priority,
    required this.isRead,
    required this.createdAt,
  });

  factory DashboardNotification.fromJson(Map<String, Object?> json) =>
      DashboardNotification(
        id: json.requireString('id'),
        title: json.requireString('title'),
        message: json['message'] as String? ?? '',
        priority: json['priority'] as String? ?? 'normal',
        isRead: json['isRead'] as bool? ?? false,
        createdAt: json['createdAt'] as String? ?? '',
      );

  final String id;
  final String title;
  final String message;
  final String priority;
  final bool isRead;
  final String createdAt;
}

class DashboardAnnouncement {
  const DashboardAnnouncement({
    required this.id,
    required this.title,
    required this.description,
    required this.priority,
    required this.bannerUrl,
    required this.publishFrom,
  });

  factory DashboardAnnouncement.fromJson(Map<String, Object?> json) =>
      DashboardAnnouncement(
        id: json.requireString('id'),
        title: json.requireString('title'),
        description: json['description'] as String? ?? '',
        priority: json['priority'] as String? ?? 'normal',
        bannerUrl: json['bannerUrl'] as String?,
        publishFrom: json['publishFrom'] as String?,
      );

  final String id;
  final String title;
  final String description;
  final String priority;
  final String? bannerUrl;
  final String? publishFrom;
}

class DashboardCelebration {
  const DashboardCelebration({
    required this.type,
    required this.title,
    required this.yearsCompleted,
  });

  factory DashboardCelebration.fromJson(Map<String, Object?> json) =>
      DashboardCelebration(
        type: json.requireString('type'),
        title: json.requireString('title'),
        yearsCompleted: json['yearsCompleted'] as int?,
      );

  final String type;
  final String title;
  final int? yearsCompleted;
}

class DashboardToday {
  const DashboardToday({
    required this.date,
    required this.status,
    required this.title,
    required this.celebrations,
  });

  factory DashboardToday.fromJson(Map<String, Object?> json) {
    final values = json['celebrations'];
    return DashboardToday(
      date: json.requireString('date'),
      status: json.requireString('status'),
      title: json.requireString('title'),
      celebrations: values is List
          ? values
                .whereType<Map<String, Object?>>()
                .map(DashboardCelebration.fromJson)
                .toList(growable: false)
          : const [],
    );
  }

  final String date;
  final String status;
  final String title;
  final List<DashboardCelebration> celebrations;
}

class DashboardContent {
  const DashboardContent({
    required this.quickLinksStatus,
    required this.quickLinks,
    required this.notificationsStatus,
    required this.unreadNotificationCount,
    required this.notifications,
    required this.announcementsStatus,
    required this.announcements,
    required this.todayStatus,
    required this.today,
  });

  const DashboardContent.empty()
    : quickLinksStatus = DashboardSectionStatus.disabled,
      quickLinks = const [],
      notificationsStatus = DashboardSectionStatus.disabled,
      unreadNotificationCount = 0,
      notifications = const [],
      announcementsStatus = DashboardSectionStatus.disabled,
      announcements = const [],
      todayStatus = DashboardSectionStatus.disabled,
      today = null;

  factory DashboardContent.fromJson(Map<String, Object?> json) {
    final quickLinks = json['quickLinks'] as Map<String, Object?>?;
    final notificationSection = json['notifications'] as Map<String, Object?>?;
    final notificationData =
        notificationSection?['data'] as Map<String, Object?>?;
    final announcements = json['announcements'] as Map<String, Object?>?;
    final todaySection = json['today'] as Map<String, Object?>?;
    final todayData = todaySection?['data'];
    return DashboardContent(
      quickLinksStatus: DashboardSectionStatus.parse(quickLinks?['status']),
      quickLinks: _mapList(quickLinks?['data'], DashboardQuickLink.fromJson),
      notificationsStatus: DashboardSectionStatus.parse(
        notificationSection?['status'],
      ),
      unreadNotificationCount: notificationData?['unreadCount'] as int? ?? 0,
      notifications: _mapList(
        notificationData?['items'],
        DashboardNotification.fromJson,
      ),
      announcementsStatus: DashboardSectionStatus.parse(
        announcements?['status'],
      ),
      announcements: _mapList(
        announcements?['data'],
        DashboardAnnouncement.fromJson,
      ),
      todayStatus: DashboardSectionStatus.parse(todaySection?['status']),
      today: todayData is Map<String, Object?>
          ? DashboardToday.fromJson(todayData)
          : null,
    );
  }

  final DashboardSectionStatus quickLinksStatus;
  final List<DashboardQuickLink> quickLinks;
  final DashboardSectionStatus notificationsStatus;
  final int unreadNotificationCount;
  final List<DashboardNotification> notifications;
  final DashboardSectionStatus announcementsStatus;
  final List<DashboardAnnouncement> announcements;
  final DashboardSectionStatus todayStatus;
  final DashboardToday? today;
}

List<T> _mapList<T>(Object? value, T Function(Map<String, Object?>) parse) =>
    value is List
    ? value.whereType<Map<String, Object?>>().map(parse).toList(growable: false)
    : const [];

class DashboardState {
  const DashboardState({
    required this.profile,
    required this.features,
    required this.enabledFeatureKeys,
    this.content = const DashboardContent.empty(),
  });

  factory DashboardState.fromJson(Map<String, Object?> json) {
    final featuresValue = json['features'];
    final enabledValue = json['enabledFeatureKeys'];
    final contentValue = json['content'];
    return DashboardState(
      profile: DashboardProfile.fromJson(json.requireMap('profile')),
      features: featuresValue is List
          ? featuresValue
                .whereType<Map<String, Object?>>()
                .map(DashboardFeatureFlag.fromJson)
                .toList(growable: false)
          : const [],
      enabledFeatureKeys: enabledValue is List
          ? enabledValue.whereType<String>().toList(growable: false)
          : const [],
      content: contentValue is Map<String, Object?>
          ? DashboardContent.fromJson(contentValue)
          : const DashboardContent.empty(),
    );
  }

  final DashboardProfile profile;
  final List<DashboardFeatureFlag> features;
  final List<String> enabledFeatureKeys;
  final DashboardContent content;
}
