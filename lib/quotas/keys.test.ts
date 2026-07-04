import { describe, expect, it } from "vitest";

import { userHasKeysForOperation } from "@/lib/quotas/keys";

describe("userHasKeysForOperation", () => {
  const keys = {
    openaiKey: "sk-openai",
    elevenlabsKey: "el-key",
  };

  it("requires OpenAI when the operation needs it", () => {
    expect(
      userHasKeysForOperation(
        { openaiKey: null, elevenlabsKey: "el-key" },
        { openai: true },
      ),
    ).toBe(false);
    expect(userHasKeysForOperation(keys, { openai: true })).toBe(true);
  });

  it("requires ElevenLabs when the operation needs it", () => {
    expect(
      userHasKeysForOperation(
        { openaiKey: "sk-openai", elevenlabsKey: null },
        { elevenlabs: true },
      ),
    ).toBe(false);
    expect(userHasKeysForOperation(keys, { elevenlabs: true })).toBe(true);
  });

  it("requires both keys for voice operations", () => {
    expect(
      userHasKeysForOperation(
        { openaiKey: "sk-openai", elevenlabsKey: null },
        { openai: true, elevenlabs: true },
      ),
    ).toBe(false);

    expect(
      userHasKeysForOperation(keys, { openai: true, elevenlabs: true }),
    ).toBe(true);
  });

  it("passes when no keys are required", () => {
    expect(
      userHasKeysForOperation(
        { openaiKey: null, elevenlabsKey: null },
        {},
      ),
    ).toBe(true);
  });
});
