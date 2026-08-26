import 'package:employee_android/src/models/dashboard_state.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('dashboard content parses supported sections and unread state', () {
    final state = DashboardState.fromJson({
      'profile': {
        'employeeId': 'EMP-001',
        'name': 'Employee',
        'companyId': 'company-a',
        'roleName': 'Employee',
        'companyName': 'Company Hub',
        'photoUrl': null,
      },
      'features': [
        {'key': 'quick_links', 'enabled': true},
      ],
      'enabledFeatureKeys': ['quick_links'],
      'content': {
        'quickLinks': {
          'status': 'ready',
          'data': [
            {
              'id': 'link-a',
              'title': 'Handbook',
              'description': 'Policies',
              'categoryName': 'Knowledge',
              'url': 'https://example.com',
              'icon': 'book',
              'thumbnailUrl': null,
              'openMode': 'external',
              'isFeatured': true,
            },
          ],
        },
        'notifications': {
          'status': 'ready',
          'data': {
            'unreadCount': 1,
            'items': [
              {
                'id': 'notification-a',
                'title': 'Update',
                'message': 'Visible to this employee.',
                'priority': 'normal',
                'isRead': false,
                'createdAt': '2026-08-26T08:00:00.000Z',
              },
            ],
          },
        },
        'announcements': {'status': 'ready', 'data': <Object?>[]},
        'today': {
          'status': 'ready',
          'data': {
            'date': '2026-08-26',
            'status': 'working_day',
            'title': 'Working Day',
            'celebrations': <Object?>[],
          },
        },
      },
    });

    expect(state.content.quickLinks.single.title, 'Handbook');
    expect(state.content.unreadNotificationCount, 1);
    expect(state.content.notifications.single.isRead, isFalse);
    expect(state.content.announcements, isEmpty);
    expect(state.content.today?.status, 'working_day');
  });

  test('missing dashboard content remains backward compatible', () {
    final state = DashboardState.fromJson({
      'profile': {
        'employeeId': 'EMP-001',
        'name': 'Employee',
        'companyId': 'company-a',
        'roleName': 'Employee',
        'companyName': 'Company Hub',
        'photoUrl': null,
      },
      'features': const [],
      'enabledFeatureKeys': const [],
    });

    expect(state.content.quickLinksStatus, DashboardSectionStatus.disabled);
    expect(state.content.notifications, isEmpty);
  });
}
