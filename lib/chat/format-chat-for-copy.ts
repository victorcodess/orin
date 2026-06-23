import { isTextUIPart, type UIMessage } from "ai";

import { PENDING_ASSISTANT_ID } from "@/components/chat/message-list";
import type { MessageRow } from "@/lib/ai/message-utils";
import { isVoiceLiveMessageId } from "@/lib/stores/voice-live-messages-store";

type FormatChatForCopyOptions = {
  conversationId: string;
  assistantName: string;
  messages: UIMessage[];
  messageSources?: Record<string, MessageRow["source"]>;
  voiceCallStatus?: string;
};

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function messageSource(
  message: UIMessage,
  messageSources: Record<string, MessageRow["source"]> | undefined,
) {
  if (messageSources?.[message.id]) {
    return messageSources[message.id];
  }

  return isVoiceLiveMessageId(message.id) ? "voice" : "text";
}

export function formatChatForCopy({
  conversationId,
  assistantName,
  messages,
  messageSources,
  voiceCallStatus,
}: FormatChatForCopyOptions) {
  const lines = [
    "Orin chat export",
    `Conversation: ${conversationId}`,
    `Assistant: ${assistantName}`,
  ];

  if (voiceCallStatus && voiceCallStatus !== "idle") {
    lines.push(`Voice call: ${voiceCallStatus}`);
  }

  lines.push("");

  const visible = messages.filter(
    (message) =>
      message.role !== "system" && message.id !== PENDING_ASSISTANT_ID,
  );

  if (visible.length === 0) {
    lines.push("(empty thread)");
    return lines.join("\n");
  }

  for (const message of visible) {
    const text = textFromMessage(message);
    const source = messageSource(message, messageSources);
    const streaming = message.parts.some(
      (part) => isTextUIPart(part) && part.state === "streaming",
    );
    const flags = [
      message.role,
      source,
      isVoiceLiveMessageId(message.id) ? "live-id" : null,
      streaming ? "streaming" : null,
      text.trim() ? null : "empty",
    ].filter(Boolean);

    lines.push("---");
    lines.push(`[${flags.join(" · ")}] id: ${message.id}`);
    lines.push(text.trim() || "(no text)");
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
