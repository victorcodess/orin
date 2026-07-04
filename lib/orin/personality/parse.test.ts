import { describe, expect, it } from "vitest";

import {
  DEFAULT_PERSONALITY_SETTINGS,
  PERSONALITY_IDS,
} from "@/lib/orin/personality/types";
import {
  parsePersonalitySettings,
  personalitySettingsEqual,
} from "@/lib/orin/personality/parse";

describe("parsePersonalitySettings", () => {
  it("falls back to defaults for invalid input", () => {
    expect(parsePersonalitySettings(null)).toEqual(DEFAULT_PERSONALITY_SETTINGS);
    expect(parsePersonalitySettings("warm")).toEqual(
      DEFAULT_PERSONALITY_SETTINGS,
    );
    expect(parsePersonalitySettings({ personality: "invalid" })).toEqual(
      DEFAULT_PERSONALITY_SETTINGS,
    );
  });

  it("accepts valid personality ids", () => {
    for (const personality of PERSONALITY_IDS) {
      expect(
        parsePersonalitySettings({ personality, customInstructions: "Be brief" }),
      ).toEqual({
        personality,
        customInstructions: "Be brief",
      });
    }
  });

  it("truncates custom instructions to 4000 characters", () => {
    const long = "x".repeat(5000);
    const parsed = parsePersonalitySettings({
      personality: "calm",
      customInstructions: long,
    });

    expect(parsed.customInstructions).toHaveLength(4000);
  });
});

describe("personalitySettingsEqual", () => {
  it("compares trimmed custom instructions", () => {
    expect(
      personalitySettingsEqual(
        { personality: "warm", customInstructions: " hello " },
        { personality: "warm", customInstructions: "hello" },
      ),
    ).toBe(true);

    expect(
      personalitySettingsEqual(
        { personality: "warm", customInstructions: "" },
        { personality: "curious", customInstructions: "" },
      ),
    ).toBe(false);
  });
});
