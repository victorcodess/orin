"use client";

import {
  ComputerIcon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";

import {
  SettingsGroup,
  SettingsOption,
  SettingsOptionGrid,
  SettingsPage,
  SettingsRow,
  SettingsSelect,
} from "@/components/settings/settings-ui";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import {
  useMessageStyleStore,
  type MessageBubbleLayout,
} from "@/lib/stores/message-style-store";

const THEME_OPTIONS = [
  { value: "system", label: "System", icon: ComputerIcon },
  { value: "light", label: "Light", icon: Sun01Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
] as const;

const LAYOUT_OPTIONS: {
  value: MessageBubbleLayout;
  label: string;
}[] = [
  { value: "single-bubble", label: "Single bubble" },
  { value: "both-bubbles", label: "Separate bubbles" },
];

export function SettingsGeneral() {
  const hydrated = useHydrated();
  const { theme, setTheme } = useTheme();
  const layout = useMessageStyleStore((state) => state.layout);
  const setLayout = useMessageStyleStore((state) => state.setLayout);

  return (
    <SettingsPage>
      <SettingsGroup>
        <SettingsRow
          title="Theme"
          description="Choose how Orin looks on your device."
        >
          <SettingsOptionGrid>
            {THEME_OPTIONS.map((option) => {
              const active = hydrated && theme === option.value;

              return (
                <SettingsOption
                  key={option.value}
                  active={active}
                  onClick={() => setTheme(option.value)}
                  className="inline-flex items-center gap-2"
                >
                  <HugeiconsIcon
                    icon={option.icon}
                    strokeWidth={2}
                    className="size-4 shrink-0"
                  />
                  {option.label}
                </SettingsOption>
              );
            })}
          </SettingsOptionGrid>
        </SettingsRow>

        <SettingsRow
          title="Language"
          description="Orin's interface language."
          withSeparator
        >
          <SettingsSelect value="en" disabled>
            <option value="en">English</option>
          </SettingsSelect>
        </SettingsRow>

        <SettingsRow
          title="Message layout"
          description="How messages appear in the chat thread."
          withSeparator
        >
          <SettingsOptionGrid>
            {LAYOUT_OPTIONS.map((option) => (
              <SettingsOption
                key={option.value}
                active={layout === option.value}
                onClick={() => setLayout(option.value)}
              >
                {option.label}
              </SettingsOption>
            ))}
          </SettingsOptionGrid>
        </SettingsRow>
      </SettingsGroup>
    </SettingsPage>
  );
}
