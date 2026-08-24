import 'package:flutter/material.dart';

import 'update_controller.dart';

class UpdateReminder extends StatelessWidget {
  const UpdateReminder({
    required this.controller,
    required this.child,
    super.key,
  });
  final UpdateController? controller;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final current = controller;
    if (current == null) return child;
    return ListenableBuilder(
      listenable: current,
      builder: (context, _) => Stack(
        children: [
          child,
          if (current.shouldShow)
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: SafeArea(
                child: Material(
                  elevation: 8,
                  borderRadius: BorderRadius.circular(20),
                  color: Theme.of(context).colorScheme.surfaceContainerHigh,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'A new version of Company Hub is available.',
                          key: const Key('updateReminderTitle'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Version ${current.available!.versionName} can be installed when convenient.',
                        ),
                        if (current.errorMessage case final message?) ...[
                          const SizedBox(height: 8),
                          Text(
                            message,
                            key: const Key('updateError'),
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.error,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              key: const Key('updateLaterButton'),
                              onPressed: current.installing
                                  ? null
                                  : current.later,
                              child: const Text('Later'),
                            ),
                            const SizedBox(width: 8),
                            FilledButton(
                              key: const Key('updateNowButton'),
                              onPressed: current.installing
                                  ? null
                                  : current.updateNow,
                              child: Text(
                                current.installing
                                    ? 'Downloading…'
                                    : 'Update Now',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
