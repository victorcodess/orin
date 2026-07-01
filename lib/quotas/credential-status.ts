import type { QuotaOperation, QuotaUsageSummary } from "@/lib/quotas/types";

export type CapabilityId = "text_chat" | "voice" | "read_aloud";

export type CredentialStatusKind =
  | "platform"
  | "user"
  | "blocked"
  | "sign_in_required";

export type AllowancePart = {
  used: number;
  total: number;
  label: string;
};

export type CapabilitySnapshot = {
  id: CapabilityId;
  label: string;
  description: string;
  kind: CredentialStatusKind;
  statusLabel: string;
  allowance?: AllowancePart[];
  nextStep?: string;
};

type CapabilityConfig = {
  id: CapabilityId;
  label: string;
  description: string;
  operations: QuotaOperation[];
  primaryOperation: QuotaOperation;
  needsOpenai: boolean;
  needsElevenlabs: boolean;
  requiresAuth: boolean;
};

const CAPABILITIES: CapabilityConfig[] = [
  {
    id: "text_chat",
    label: "Text chat",
    description: "New conversations and messages",
    operations: ["new_conversation", "message_turn"],
    primaryOperation: "message_turn",
    needsOpenai: true,
    needsElevenlabs: false,
    requiresAuth: false,
  },
  {
    id: "voice",
    label: "Voice calls",
    description: "Speak with Orin in the same thread",
    operations: ["voice_session"],
    primaryOperation: "voice_session",
    needsOpenai: true,
    needsElevenlabs: true,
    requiresAuth: true,
  },
  {
    id: "read_aloud",
    label: "Read aloud",
    description: "Hear assistant replies spoken aloud",
    operations: ["read_aloud"],
    primaryOperation: "read_aloud",
    needsOpenai: false,
    needsElevenlabs: true,
    requiresAuth: true,
  },
];

const STATUS_LABELS: Record<CredentialStatusKind, string> = {
  platform: "Free allowance",
  user: "Your keys",
  blocked: "Blocked",
  sign_in_required: "Sign up required",
};

function isUnderAllowance(
  usage: QuotaUsageSummary,
  config: CapabilityConfig,
): boolean {
  return config.operations.some((operation) => usage.remaining[operation] > 0);
}

function missingProviders(
  usage: QuotaUsageSummary,
  config: CapabilityConfig,
): string[] {
  const missing: string[] = [];

  if (config.needsOpenai && !usage.keys.hasOpenaiKey) {
    missing.push("OpenAI");
  }
  if (config.needsElevenlabs && !usage.keys.hasElevenlabsKey) {
    missing.push("ElevenLabs");
  }

  return missing;
}

function allowanceParts(
  usage: QuotaUsageSummary,
  config: CapabilityConfig,
): AllowancePart[] {
  if (config.id === "text_chat") {
    return [
      {
        used: usage.used.message_turn,
        total: usage.limits.message_turn,
        label: "messages",
      },
      {
        used: usage.used.new_conversation,
        total: usage.limits.new_conversation,
        label: "new chats",
      },
    ];
  }

  const used = usage.used[config.primaryOperation];
  const total = usage.limits[config.primaryOperation];

  if (config.id === "voice") {
    return [
      {
        used: usage.used.voice_session,
        total: usage.limits.voice_session,
        label: "minutes",
      },
    ];
  }

  return [{ used, total, label: "read-aloud uses" }];
}

function resolveKind(
  usage: QuotaUsageSummary,
  config: CapabilityConfig,
): CredentialStatusKind {
  if (config.requiresAuth && usage.tier === "anon") {
    return "sign_in_required";
  }

  if (isUnderAllowance(usage, config)) {
    return "platform";
  }

  if (usage.tier === "anon") {
    return "sign_in_required";
  }

  if (missingProviders(usage, config).length === 0) {
    return "user";
  }

  return "blocked";
}

function resolveNextStep(
  kind: CredentialStatusKind,
  config: CapabilityConfig,
  usage: QuotaUsageSummary,
): string | undefined {
  if (kind === "platform") {
    return undefined;
  }

  if (kind === "user") {
    return "Free allowance used — continuing on your API keys.";
  }

  if (kind === "sign_in_required") {
    if (config.requiresAuth && usage.tier === "anon") {
      return "Sign up to unlock voice calls and read aloud.";
    }

    return "Free allowance used. Create an account to continue.";
  }

  const missing = missingProviders(usage, config);
  if (missing.length === 0) {
    return undefined;
  }

  return `Add your ${missing.join(" and ")} API key${missing.length > 1 ? "s" : ""} below to continue.`;
}

function shouldShowAllowance(
  kind: CredentialStatusKind,
  config: CapabilityConfig,
): boolean {
  return !(kind === "sign_in_required" && config.requiresAuth);
}

export function buildCapabilitySnapshots(
  usage: QuotaUsageSummary,
): CapabilitySnapshot[] {
  return CAPABILITIES.map((config) => {
    const kind = resolveKind(usage, config);

    return {
      id: config.id,
      label: config.label,
      description: config.description,
      kind,
      statusLabel: STATUS_LABELS[kind],
      allowance: shouldShowAllowance(kind, config)
        ? allowanceParts(usage, config)
        : undefined,
      nextStep: resolveNextStep(kind, config, usage),
    };
  });
}
