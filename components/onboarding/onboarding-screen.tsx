"use client";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { completeOnboarding } from "@/app/auth/actions";
import { toast } from "@/components/nexus-ui/toaster";
import {
  SettingsField,
  SettingsGroup,
  SettingsRow,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { OnboardingSession } from "@/lib/auth/onboarding-session";
import { CURATED_VOICES } from "@/lib/elevenlabs/voices";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { personalitySettingsEqual } from "@/lib/orin/personality/parse";
import {
  BASE_STYLE_OPTIONS,
  TRAIT_LEVEL_OPTIONS,
  type PersonalityOption,
} from "@/lib/orin/personality/ui-options";
import type { PersonalitySettings } from "@/lib/orin/personality/types";
import {
  VOICE_SPEED_OPTIONS,
  type VoiceSpeed,
} from "@/lib/orin/voice/speed";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import {
  hydrateOnboardingSession,
  useAuthStore,
} from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";

type VoicePickerComponent =
  typeof import("@/components/elevenlabs/voice-picker").VoicePicker;

function DropdownTriggerSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-full rounded-3xl", className)} />;
}

function VoicePickerSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-9 w-full rounded-full", className)} />;
}

function OnboardingHeader() {
  return (
    <div className="space-y-2 text-center">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        Make Orin yours
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed font-[450] md:text-base">
        Pick a tone and voice. You can change these anytime in Settings.
      </p>
    </div>
  );
}

function PersonalityDropdown<T extends string>({
  value,
  options,
  onValueChange,
  className,
  compact = false,
  loading = false,
}: {
  value: T;
  options: PersonalityOption<T>[] | { value: T; label: string }[];
  onValueChange: (value: T) => void;
  className?: string;
  compact?: boolean;
  loading?: boolean;
}) {
  if (loading) {
    return <DropdownTriggerSkeleton className={className} />;
  }

  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "border-input bg-background/80 h-10 w-full justify-between rounded-3xl px-3.5 text-sm font-medium shadow-xs/1",
            className,
          )}
        >
          <span className="truncate">{selected.label}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange(next as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className={cn(
                "rounded-2xl pr-8 pl-3",
                compact ? "py-2" : "h-auto items-start py-2",
              )}
            >
              {compact ? (
                <span className="text-foreground text-sm font-medium">
                  {option.label}
                </span>
              ) : (
                <span className="flex flex-col gap-0.25 text-left">
                  <span className="text-foreground text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed font-[450]">
                    {"description" in option ? option.description : null}
                  </span>
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CompactField({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div>
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}

export function OnboardingScreen() {
  const router = useRouter();
  const userId = useAuthStore((state) => state.userId);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const onboardingCompleted = useAuthStore((state) => state.onboardingCompleted);
  const config = useAssistantConfigStore((state) => state.config);
  const configLoading = useAssistantConfigStore((state) => state.isLoading);
  const save = useAssistantConfigStore((state) => state.save);
  const [isPending, startTransition] = useTransition();
  const [personalitySettings, setPersonalitySettings] =
    useState<PersonalitySettings>(DEFAULT_ASSISTANT.personalitySettings);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_ASSISTANT.voiceId);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(
    DEFAULT_ASSISTANT.voiceSpeed,
  );
  const [controlsReady, setControlsReady] = useState(false);
  const [VoicePicker, setVoicePicker] = useState<VoicePickerComponent | null>(
    null,
  );

  const pickerVoices = useMemo(
    () => CURATED_VOICES as unknown as ElevenLabs.Voice[],
    [],
  );

  useEffect(() => {
    void useAssistantConfigStore.getState().init();
    void import("@/components/elevenlabs/voice-picker").then((module) => {
      setVoicePicker(() => module.VoicePicker);
    });
  }, []);

  useEffect(() => {
    if (userId === undefined) {
      return;
    }

    if (!isLoggedIn) {
      router.replace("/auth/login?next=/onboarding");
      return;
    }

    if (onboardingCompleted) {
      router.replace("/new");
    }
  }, [userId, isLoggedIn, onboardingCompleted, router]);

  useLayoutEffect(() => {
    if (configLoading) {
      setControlsReady(false);
      return;
    }

    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
    setVoiceSpeed(config.voiceSpeed);
    setControlsReady(true);
  }, [config, configLoading]);

  const updateSettings = useCallback((patch: Partial<PersonalitySettings>) => {
    setPersonalitySettings((current) => ({ ...current, ...patch }));
  }, []);

  const handleContinue = () => {
    startTransition(async () => {
      const saved = await save({
        personalitySettings,
        voiceId,
        voiceSpeed,
      });

      if (!saved) {
        toast.error("Could not save your preferences");
        return;
      }

      await completeOnboarding();
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      await completeOnboarding();
    });
  };

  const hasEdits =
    !personalitySettingsEqual(
      personalitySettings,
      DEFAULT_ASSISTANT.personalitySettings,
    ) ||
    voiceId !== DEFAULT_ASSISTANT.voiceId ||
    voiceSpeed !== DEFAULT_ASSISTANT.voiceSpeed;

  return (
    <div className="flex w-full flex-col gap-6">
      <OnboardingHeader />
      <SettingsGroup>
        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
          <CompactField
            title="Style"
            description="Orin's overall personality in text and on calls."
          >
            <PersonalityDropdown
              value={personalitySettings.baseStyle}
              options={BASE_STYLE_OPTIONS}
              loading={!controlsReady}
              onValueChange={(baseStyle) =>
                updateSettings({
                  baseStyle: baseStyle as PersonalitySettings["baseStyle"],
                })
              }
            />
          </CompactField>

          <CompactField
            title="Warm"
            description="How caring and emotionally present Orin sounds."
          >
            <PersonalityDropdown
              value={personalitySettings.warm}
              options={TRAIT_LEVEL_OPTIONS}
              loading={!controlsReady}
              onValueChange={(warm) =>
                updateSettings({ warm: warm as PersonalitySettings["warm"] })
              }
            />
          </CompactField>
        </div>

        <div className="border-border/40 border-t px-4 py-4">
          <SettingsField
            label="Custom instructions"
            description="Anything else you want Orin to keep in mind."
            htmlFor="onboarding-custom-instructions"
          >
            <Textarea
              id="onboarding-custom-instructions"
              value={personalitySettings.customInstructions}
              rows={3}
              maxLength={4000}
              placeholder="Additional behavior, style, and tone preferences"
              onChange={(event) =>
                updateSettings({ customInstructions: event.target.value })
              }
            />
          </SettingsField>
        </div>

        <SettingsRow
          title="Voice"
          description="Orin's voice for read-aloud and calls."
          withSeparator
        >
          {!(controlsReady && VoicePicker) ? (
            <VoicePickerSkeleton />
          ) : (
            <VoicePicker
              voices={pickerVoices}
              value={voiceId}
              voiceSpeed={voiceSpeed}
              onValueChange={setVoiceId}
              placeholder="Select a voice..."
            />
          )}
        </SettingsRow>

        <SettingsRow
          title="Speed"
          description="How fast Orin speaks on calls and read-aloud."
          withSeparator
        >
          <PersonalityDropdown
            value={voiceSpeed}
            options={VOICE_SPEED_OPTIONS}
            loading={!controlsReady}
            onValueChange={(value) => setVoiceSpeed(value as VoiceSpeed)}
            compact
            className="sm:w-44"
          />
        </SettingsRow>
      </SettingsGroup>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          onClick={handleSkip}
        >
          Skip for now
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={isPending}
          onClick={handleContinue}
          className={cn("w-full sm:w-auto", !hasEdits && "sm:min-w-32")}
        >
          {isPending ? "Saving..." : "Continue to Orin"}
        </Button>
      </div>
    </div>
  );
}

export function OnboardingSessionHydrator({
  session,
}: {
  session: OnboardingSession;
}) {
  const hydrated = useRef(false);

  useLayoutEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      hydrateOnboardingSession(session);
    }

    return useAuthStore.getState().init();
  }, [session]);

  return null;
}
