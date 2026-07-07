import { describe, expect, it } from "vitest";

import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { buildRuntimeContext } from "@/lib/orin/personality/runtime-context";
import { DEFAULT_PERSONALITY_SETTINGS } from "@/lib/orin/personality/types";

describe("buildRuntimeContext", () => {
  it("includes account details, modality, and custom instructions", () => {
    const context = buildRuntimeContext({
      mode: "text",
      userName: "Victor",
      customInstructions: "Keep answers short.",
      now: new Date("2026-07-03T13:15:00Z"),
      timeZone: "Europe/London",
    });

    expect(context).toContain("they shared it through their account");
    expect(context).toContain("**Name:** Victor");
    expect(context).toContain("**Local time:**");
    expect(context).toContain("Text chat — they're typing messages.");
    expect(context).toContain("Keep answers short.");
  });

  it("handles missing user name and custom instructions", () => {
    const context = buildRuntimeContext({
      mode: "voice",
      now: new Date("2026-07-03T13:15:00Z"),
      timeZone: "UTC",
    });

    expect(context).toContain("**Name:** not shared");
    expect(context).toContain("Voice call — they're talking to you live.");
    expect(context).toContain("hasn't set any personal instructions");
  });
});

describe("buildPersonalityPrompt", () => {
  it("includes runtime context with custom instructions", () => {
    const prompt = buildPersonalityPrompt(
      {
        personality: "direct",
        customInstructions: "Keep answers short.",
      },
      "text",
      { userName: "Victor", timeZone: "UTC" },
    );

    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain("Keep answers short.");
    expect(prompt).toContain("**Name:** Victor");
    expect(prompt).toContain("Text chat — they're typing messages.");
  });

  it("adds voice context only in voice mode", () => {
    const textPrompt = buildPersonalityPrompt(DEFAULT_PERSONALITY_SETTINGS, "text");
    const voicePrompt = buildPersonalityPrompt(
      DEFAULT_PERSONALITY_SETTINGS,
      "voice",
    );

    expect(voicePrompt.length).toBeGreaterThan(textPrompt.length);
    expect(voicePrompt).toContain("Voice call — they're talking to you live.");
  });

  it("always includes runtime context", () => {
    const prompt = buildPersonalityPrompt(DEFAULT_PERSONALITY_SETTINGS);

    expect(prompt).toContain("## Account");
    expect(prompt).toContain("## Custom instructions");
  });
});
