import { debugLog } from "@/lib/debug";

export type DictationSession = {
  id: number;
  startedAt: number;
};

let sessionCounter = 0;

export function beginDictationSession(): DictationSession {
  const session: DictationSession = {
    id: ++sessionCounter,
    startedAt: performance.now(),
  };

  debugLog("dictation", `session #${session.id} started`);
  return session;
}

export function dictationLog(
  session: DictationSession | null,
  step: string,
  data?: unknown
) {
  const elapsed =
    session === null
      ? undefined
      : Math.round(performance.now() - session.startedAt);

  logDictationStep(step, elapsed, data);
}

export function dictationStep(
  step: string,
  startedAt?: number,
  data?: unknown
) {
  const elapsed =
    startedAt === undefined
      ? undefined
      : Math.round(performance.now() - startedAt);

  logDictationStep(step, elapsed, data);
}

function logDictationStep(step: string, elapsed?: number, data?: unknown) {
  const suffix = elapsed === undefined ? "" : ` (+${elapsed}ms)`;
  debugLog("dictation", `${step}${suffix}`, data);
}
