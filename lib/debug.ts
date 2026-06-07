const DEBUG = process.env.NODE_ENV === "development";

export function debugLog(scope: string, message: string, data?: unknown) {
  if (!DEBUG) return;

  const prefix = `[orin:${scope}]`;
  if (data !== undefined) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export function debugError(scope: string, message: string, error?: unknown) {
  if (!DEBUG) return;

  console.error(`[orin:${scope}]`, message, error);
}
