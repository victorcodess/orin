import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it } from "vitest";

import {
  isAssistantReplyComplete,
  sanitizeUIMessagesForModel,
  textFromUIMessage,
} from "@/lib/ai/message-utils";

let messageCounter = 0;

function message(
  role: UIMessage["role"],
  text: string,
  state?: "streaming" | "done",
): UIMessage {
  messageCounter += 1;

  return {
    id: `msg-${messageCounter}`,
    role,
    parts: [{ type: "text", text, ...(state ? { state } : {}) }],
  };
}

beforeEach(() => {
  messageCounter = 0;
});

describe("textFromUIMessage", () => {
  it("joins text parts", () => {
    const uiMessage: UIMessage = {
      id: "1",
      role: "user",
      parts: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    };

    expect(textFromUIMessage(uiMessage)).toBe("Hello world");
  });
});

describe("sanitizeUIMessagesForModel", () => {
  it("drops system and empty turns", () => {
    const keptUser = message("user", "Hi");
    const keptAssistant = message("assistant", "Hello");
    const messages = [
      message("system", "You are Orin"),
      message("user", "   "),
      message("assistant", ""),
      keptUser,
      keptAssistant,
    ];

    expect(sanitizeUIMessagesForModel(messages)).toEqual([
      keptUser,
      keptAssistant,
    ]);
  });
});

describe("isAssistantReplyComplete", () => {
  it("returns false when there is no user message", () => {
    expect(isAssistantReplyComplete([message("assistant", "Hi")])).toBe(false);
  });

  it("returns false while assistant text is streaming", () => {
    const messages = [
      message("user", "Hi"),
      message("assistant", "Hel", "streaming"),
    ];

    expect(isAssistantReplyComplete(messages)).toBe(false);
  });

  it("returns true when the latest assistant reply has finished text", () => {
    const messages = [
      message("user", "Hi"),
      message("assistant", "Hello there"),
    ];

    expect(isAssistantReplyComplete(messages)).toBe(true);
  });

  it("ignores empty assistant replies after the last user turn", () => {
    const messages = [
      message("user", "Hi"),
      message("assistant", "   "),
    ];

    expect(isAssistantReplyComplete(messages)).toBe(false);
  });
});
