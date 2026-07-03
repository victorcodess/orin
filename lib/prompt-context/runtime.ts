export type ReplyModality = "text" | "voice";

export type PromptRuntimeContext = {
  timeZone?: string | null;
  modality: ReplyModality;
  now?: Date;
};

export function normalizeTimeZone(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const timeZone = value.trim();
  if (!timeZone) {
    return null;
  }

  try {
    Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return null;
  }
}

function formatPromptDateTime(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);
}

export function buildRuntimeContextSection(
  context: PromptRuntimeContext,
): string {
  const now = context.now ?? new Date();
  const timeZone = normalizeTimeZone(context.timeZone) ?? "UTC";
  const formatted = formatPromptDateTime(now, timeZone);
  const isVoice = context.modality === "voice";

  const modalityLine = isVoice
    ? "Active modality: voice. This reply will be spoken aloud — natural rhythm, no markdown or bullet lists."
    : "Active modality: text. This reply is read on screen — markdown is fine. They can start a voice call in this thread anytime.";

  const modalityIfAsked = isVoice
    ? 'If they ask, say you are on a call — not that you inferred it from how they typed.'
    : 'If they ask, say you are texting — not because they typed or sent messages.';

  return `# Context

Current local date and time for the user: ${formatted} (${timeZone}).

${modalityLine}
${modalityIfAsked}

Memory: you only know this thread plus account details above (such as their name). No cross-chat memory.

Meta questions — answer the fact first, then one short plain line if they ask how you know:
- Time: give the time, then "That's your local time." No account settings or hidden context.
- Name: give their name, then "From your account."
- Text vs voice: "We're texting" or "We're on a call."
- Calling: yes, they can call you here. Answer like a person, not "this capability is available."`;
}
