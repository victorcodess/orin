export type QuotaOperation =
  | "new_conversation"
  | "message_turn"
  | "voice_session"
  | "read_aloud";

export type QuotaContext = {
  userId: string | null;
  sessionId: string | null;
  /** When omitted, treated as non-admin (e.g. voice sidecar partial context). */
  isAdmin?: boolean;
};

export type QuotaTier = "anon" | "authed";

export type KeySource = "platform" | "user";

export type ResolvedKeys = {
  openaiKey: string;
  elevenlabsKey: string;
  openaiSource: KeySource;
  elevenlabsSource: KeySource;
};

export type QuotaKeysSummary = {
  openaiMasked: string | null;
  elevenlabsMasked: string | null;
  hasOpenaiKey: boolean;
  hasElevenlabsKey: boolean;
};

export type QuotaUsageSummary = {
  tier: QuotaTier;
  isAdmin: boolean;
  limits: Record<QuotaOperation, number>;
  used: Record<QuotaOperation, number>;
  remaining: Record<QuotaOperation, number>;
  keys: QuotaKeysSummary;
};
