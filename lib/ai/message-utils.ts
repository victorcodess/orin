import { isTextUIPart, type UIMessage } from "ai";

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  source: "text" | "voice";
  created_at: string;
};

export function toUIMessages(rows: MessageRow[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export function textFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

export function isAssistantReplyComplete(messages: UIMessage[]): boolean {
  const lastUserIndex = messages.findLastIndex(
    (message) => message.role === "user",
  );

  if (lastUserIndex === -1) {
    return false;
  }

  const reply = messages
    .slice(lastUserIndex + 1)
    .find((message) => message.role === "assistant");

  if (!reply) {
    return false;
  }

  const textParts = reply.parts.filter(isTextUIPart);

  if (textParts.some((part) => part.state === "streaming")) {
    return false;
  }

  return textParts.some((part) => part.text.trim().length > 0);
}
