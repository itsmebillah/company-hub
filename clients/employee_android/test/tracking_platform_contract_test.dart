import 'package:employee_android/src/tracking/tracking_platform.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('reserves stable future platform-channel method names', () {
    expect({
      TrackingChannelContract.startTracking,
      TrackingChannelContract.stopTracking,
      TrackingChannelContract.getTrackingState,
      TrackingChannelContract.retryPending,
    }, hasLength(4));
  });
}
