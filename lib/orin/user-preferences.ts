import type { MessageBubbleLayout } from "@/lib/stores/message-style-store";

export type ThemePreference = "system" | "light" | "dark";

export type UserPreferences = {
  theme: ThemePreference;
  language: string;
  messageBubbleLayout: MessageBubbleLayout;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: "system",
  language: "en",
  messageBubbleLayout: "single-bubble",
};

export function isThemePreference(value: string): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function isMessageBubbleLayout(
  value: string,
): value is MessageBubbleLayout {
  return value === "single-bubble" || value === "both-bubbles";
}
