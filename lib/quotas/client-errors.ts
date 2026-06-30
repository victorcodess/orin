import type { QuotaErrorAction, QuotaErrorCode } from "@/lib/quotas/errors";

export type ApiErrorBody = {
  error?: string;
  code?: QuotaErrorCode;
  action?: QuotaErrorAction;
};

export function parseApiErrorBody(body: unknown): ApiErrorBody {
  if (!body || typeof body !== "object") {
    return {};
  }

  const record = body as Record<string, unknown>;

  return {
    error: typeof record.error === "string" ? record.error : undefined,
    code:
      record.code === "signup_required" ||
      record.code === "keys_required" ||
      record.code === "feature_requires_auth"
        ? record.code
        : undefined,
    action:
      record.action === "signup" || record.action === "add_keys"
        ? record.action
        : undefined,
  };
}

export class FetchError extends Error {
  readonly status: number;
  readonly code?: QuotaErrorCode;
  readonly action?: QuotaErrorAction;

  constructor(
    message: string,
    status: number,
    code?: QuotaErrorCode,
    action?: QuotaErrorAction,
  ) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.code = code;
    this.action = action;
  }
}

export function isFetchError(error: unknown): error is FetchError {
  return error instanceof FetchError;
}

export async function readErrorResponse(response: Response): Promise<FetchError> {
  let message = `Request failed (${response.status})`;
  let code: QuotaErrorCode | undefined;
  let action: QuotaErrorAction | undefined;

  try {
    const body = parseApiErrorBody(await response.json());
    if (body.error) {
      message = body.error;
    }
    code = body.code;
    action = body.action;
  } catch {
    // Ignore parse errors.
  }

  return new FetchError(message, response.status, code, action);
}
