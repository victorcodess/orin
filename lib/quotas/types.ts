export type QuotaOperation =
  | "new_conversation"
  | "message_turn"
  | "voice_session"
  | "read_aloud";

export type QuotaContext = {
  userId: string | null;
  sessionId: string | null;
};

export type QuotaTier = "anon" | "authed";

export type KeySource = "platform" | "user";

export type ResolvedKeys = {
  openaiKey: string;
  elevenlabsKey: string;
  openaiSource: KeySource;
  elevenlabsSource: KeySource;
};

export type QuotaUsageSummary = {
  tier: QuotaTier;
  limits: Record<QuotaOperation, number>;
  used: Record<QuotaOperation, number>;
  remaining: Record<QuotaOperation, number>;
  hasOpenaiKey: boolean;
  hasElevenlabsKey: boolean;
};
