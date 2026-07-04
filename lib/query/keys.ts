/**
 * Centralized, type-safe query key factory.
 * Keep every key here so invalidation targets are always consistent.
 */
export const queryKeys = {
  /** Quota usage — auth-independent; the API derives the user from the session cookie. */
  usage: () => ["usage"] as const,

  /** User profile — keyed by userId so it auto-clears on auth change. */
  profile: (userId: string) => ["profile", userId] as const,

  /** Assistant personality / voice config. */
  assistantConfig: () => ["assistant-config"] as const,

  /** Flat list of sidebar conversations. */
  conversations: () => ["conversations"] as const,

  /** Full conversation thread (messages + sources + assistant). */
  conversation: (id: string) => ["conversation", id] as const,
} as const;
