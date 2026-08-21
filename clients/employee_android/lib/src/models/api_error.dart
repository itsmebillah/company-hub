class ApiException implements Exception {
  const ApiException({
    required this.code,
    required this.message,
    this.statusCode,
    this.retryAfter,
    this.outcomeAmbiguous = false,
  });

  final String code;
  final String message;
  final int? statusCode;
  final Duration? retryAfter;
  final bool outcomeAmbiguous;

  bool get isUnauthorized => statusCode == 401;

  @override
  String toString() => 'ApiException($code)';
}
