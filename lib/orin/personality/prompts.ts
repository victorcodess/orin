import "server-only";

import fs from "fs";
import path from "path";

import {
  buildRuntimeContext,
  type RuntimeContextInput,
} from "@/lib/orin/personality/runtime-context";
import type {
  PersonalityId,
  PersonalitySettings,
} from "@/lib/orin/personality/types";

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
  runtime: RuntimeContextInput = {}
): string {
  const sections = [
    CORE_SYSTEM_PROMPT,
    PERSONALITY_PROMPTS[settings.personality],
    buildRuntimeContext({
      ...runtime,
      mode,
      customInstructions:
        runtime.customInstructions ?? settings.customInstructions,
    }),
  ];

  if (mode === "voice") {
    sections.push(VOICE_CONTEXT);
  }

  return sections.join("\n\n---\n\n");
}
