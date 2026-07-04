import { describe, expect, it } from "vitest";

import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { DEFAULT_PERSONALITY_SETTINGS } from "@/lib/orin/personality/types";

describe("buildPersonalityPrompt", () => {
  it("includes core prompt, personality, and custom instructions", () => {
    const prompt = buildPersonalityPrompt({
      personality: "direct",
      customInstructions: "Keep answers short.",
    });

    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain("Keep answers short.");
    expect(prompt).toContain("## Custom instructions");
  });

  it("adds voice context only in voice mode", () => {
    const textPrompt = buildPersonalityPrompt(DEFAULT_PERSONALITY_SETTINGS, "text");
    const voicePrompt = buildPersonalityPrompt(
      DEFAULT_PERSONALITY_SETTINGS,
      "voice",
    );

    expect(voicePrompt.length).toBeGreaterThan(textPrompt.length);
  });

  it("omits custom instructions section when empty", () => {
    const prompt = buildPersonalityPrompt(DEFAULT_PERSONALITY_SETTINGS);

    expect(prompt).not.toContain("## Custom instructions");
  });
});
