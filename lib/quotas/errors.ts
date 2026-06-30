export type QuotaErrorCode =
  | "signup_required"
  | "keys_required"
  | "feature_requires_auth";

export type QuotaErrorAction = "signup" | "add_keys";

export class QuotaBlockedError extends Error {
  readonly code: QuotaErrorCode;
  readonly action: QuotaErrorAction;
  readonly status: number;

  constructor(
    message: string,
    code: QuotaErrorCode,
    action: QuotaErrorAction,
    status = 402,
  ) {
    super(message);
    this.name = "QuotaBlockedError";
    this.code = code;
    this.action = action;
    this.status = status;
  }
}

export function quotaBlockedResponse(error: QuotaBlockedError) {
  return Response.json(
    {
      error: error.message,
      code: error.code,
      action: error.action,
    },
    { status: error.status },
  );
}

export function isQuotaBlockedError(error: unknown): error is QuotaBlockedError {
  return error instanceof QuotaBlockedError;
}
