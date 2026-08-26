import 'package:flutter/services.dart';

abstract interface class ExternalLinkPlatform {
  Future<bool> open(String url);
}

class MethodChannelExternalLinkPlatform implements ExternalLinkPlatform {
  const MethodChannelExternalLinkPlatform();

  static const _channel = MethodChannel(
    'io.github.itsmebillah.companyhub.employee/external-links',
  );

  @override
  Future<bool> open(String url) async {
    final uri = Uri.tryParse(url.trim());
    if (uri == null || (uri.scheme != 'https' && uri.scheme != 'http')) {
      return false;
    }
    try {
      return await _channel.invokeMethod<bool>('open', {
            'url': uri.toString(),
          }) ??
          false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }
}
