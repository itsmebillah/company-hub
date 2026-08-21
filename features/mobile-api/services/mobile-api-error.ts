export class MobileApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "MobileApiError";
  }
}

export function mobileErrorResponse(error: unknown) {
  if (error instanceof MobileApiError) {
    return Response.json(
      { code: error.code, message: error.message },
      {
        status: error.status,
        headers: error.retryAfterSeconds
          ? { "Retry-After": String(error.retryAfterSeconds) }
          : undefined,
      },
    );
  }

  console.error("[MobileApi] Request failed.", {
    errorType: error instanceof Error ? error.name : "unknown_error",
  });
  return Response.json(
    {
      code: "service_unavailable",
      message: "The request could not be completed.",
    },
    { status: 503, headers: { "Retry-After": "30" } },
  );
}
