import "server-only";

import fs from "fs";
import path from "path";

import type { PersonalityId, PersonalitySettings } from "@/lib/orin/personality/types";

const DOCS_DIR = path.join(process.cwd(), "lib/orin/personality/docs");

function readDoc(filename: string): string {
  return fs.readFileSync(path.join(DOCS_DIR, filename), "utf-8").trim();
}

export const CORE_SYSTEM_PROMPT = readDoc("core-system-prompt.md");
export const VOICE_CONTEXT = readDoc("voice-context.md");

export const PERSONALITY_PROMPTS: Record<PersonalityId, string> = {
  warm: readDoc("warm.md"),
  curious: readDoc("curious.md"),
  playful: readDoc("playful.md"),
  calm: readDoc("calm.md"),
  direct: readDoc("direct.md"),
};

export function buildPersonalityPrompt(
  settings: PersonalitySettings,
  mode: "text" | "voice" = "text",
): string {
  const sections = [
    CORE_SYSTEM_PROMPT,
    PERSONALITY_PROMPTS[settings.personality],
  ];

  if (mode === "voice") {
    sections.push(VOICE_CONTEXT);
  }

  const custom = settings.customInstructions.trim();
  if (custom) {
    sections.push(`## Custom instructions\n\n${custom}`);
  }

  return sections.join("\n\n---\n\n");
}
