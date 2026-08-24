import 'package:flutter/services.dart';

class InstalledAppInfo {
  const InstalledAppInfo({
    required this.applicationId,
    required this.versionName,
    required this.versionCode,
  });
  factory InstalledAppInfo.fromMap(Map<Object?, Object?> value) =>
      InstalledAppInfo(
        applicationId: value['applicationId'] as String,
        versionName: value['versionName'] as String,
        versionCode: (value['versionCode'] as num).toInt(),
      );
  final String applicationId;
  final String versionName;
  final int versionCode;
}

class UpdateInstallResult {
  const UpdateInstallResult({required this.ok, this.code});
  factory UpdateInstallResult.fromMap(Map<Object?, Object?> value) =>
      UpdateInstallResult(
        ok: value['ok'] == true,
        code: value['code'] as String?,
      );
  final bool ok;
  final String? code;
}

abstract interface class UpdatePlatform {
  Future<InstalledAppInfo> getInstalledInfo();
  Future<UpdateInstallResult> downloadAndInstall({
    required Uri apkUrl,
    required String sha256,
    required int versionCode,
  });
}

class MethodChannelUpdatePlatform implements UpdatePlatform {
  MethodChannelUpdatePlatform({MethodChannel? channel})
    : _channel =
          channel ?? const MethodChannel(UpdateChannelContract.channelName);
  final MethodChannel _channel;

  @override
  Future<InstalledAppInfo> getInstalledInfo() async {
    final value = await _channel.invokeMapMethod<Object?, Object?>(
      UpdateChannelContract.getInstalledInfo,
    );
    if (value == null) {
      throw PlatformException(code: 'installed_app_unavailable');
    }
    return InstalledAppInfo.fromMap(value);
  }

  @override
  Future<UpdateInstallResult> downloadAndInstall({
    required Uri apkUrl,
    required String sha256,
    required int versionCode,
  }) async {
    try {
      final value = await _channel.invokeMapMethod<Object?, Object?>(
        UpdateChannelContract.downloadAndInstall,
        {
          'apkUrl': apkUrl.toString(),
          'sha256': sha256,
          'versionCode': versionCode,
        },
      );
      return value == null
          ? const UpdateInstallResult(ok: false, code: 'empty_native_response')
          : UpdateInstallResult.fromMap(value);
    } on PlatformException catch (error) {
      return UpdateInstallResult(ok: false, code: error.code);
    }
  }
}

abstract final class UpdateChannelContract {
  static const channelName =
      'io.github.itsmebillah.companyhub.employee/updates';
  static const getInstalledInfo = 'getInstalledInfo';
  static const downloadAndInstall = 'downloadAndInstall';
}
