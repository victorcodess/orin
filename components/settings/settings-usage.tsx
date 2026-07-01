"use client";

import { SignUpWithGoogleLink } from "@/components/auth/login-link";
import { useCallback, useRef, useState, useTransition } from "react";

import {
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsSectionIntro,
  SettingsSignInPrompt,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/nexus-ui/toaster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildCapabilitySnapshots,
  type AllowancePart,
  type CapabilitySnapshot,
  type CredentialStatusKind,
} from "@/lib/quotas/credential-status";
import { useSettingsRouteDirty } from "@/lib/hooks/use-settings-route-dirty";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUsageStore } from "@/lib/stores/usage-store";
import type { QuotaUsageSummary } from "@/lib/quotas/types";
import { cn } from "@/lib/utils";

const KEY_INPUT_CLASS =
  "mt-2 h-10 rounded-full border-input bg-card px-4 shadow-none dark:bg-input/30";

const STATUS_BADGE: Record<
  CredentialStatusKind,
  {
    variant: "secondary" | "outline" | "destructive";
    className: string;
  }
> = {
  platform: {
    variant: "secondary",
    className: "rounded-full py-1 font-normal shadow-none hover:bg-secondary",
  },
  user: {
    variant: "outline",
    className:
      "rounded-full py-1 font-normal shadow-none hover:bg-transparent",
  },
  blocked: {
    variant: "destructive",
    className:
      "rounded-full py-1 font-normal shadow-none hover:bg-destructive",
  },
  sign_in_required: {
    variant: "outline",
    className:
      "rounded-full py-1 font-normal shadow-none hover:bg-transparent",
  },
};

function AllowanceDisplay({ parts }: { parts: AllowancePart[] }) {
  return (
    <div className="flex flex-col gap-4 sm:items-end">
      {parts.map((part) => (
        <div key={part.label} className="sm:text-right">
          <p className="text-foreground text-3xl font-semibold tabular-nums leading-none tracking-tight">
            {part.used}
            <span className="text-muted-foreground ml-0.25 text-base font-medium">
              /<span className="ml-0.25">{part.total}</span>
            </span>
          </p>
          <p className="text-muted-foreground mt-1.5 text-sm leading-snug">
            {part.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function CapabilityRow({
  capability,
  onAddKeys,
  withSeparator = false,
}: {
  capability: CapabilitySnapshot;
  onAddKeys?: () => void;
  withSeparator?: boolean;
}) {
  const badge = STATUS_BADGE[capability.kind];
  const showAllowance = Boolean(capability.allowance?.length);
  const showAddKeys = capability.kind === "blocked" && onAddKeys;

  return (
    <>
      {withSeparator ? <Separator className="bg-border/40" /> : null}
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 sm:max-w-[42%]">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground text-sm font-medium">
              {capability.label}
            </p>
            <Badge variant={badge.variant} className={badge.className}>
              {capability.statusLabel}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {capability.description}
          </p>
          {capability.nextStep ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {capability.nextStep}
            </p>
          ) : null}
        </div>
        {showAllowance || showAddKeys ? (
          <div
            className={cn(
              "flex min-w-0 flex-1 sm:max-w-[52%] sm:pt-0.5",
              showAllowance && showAddKeys
                ? "flex-col items-start gap-4 sm:items-end"
                : "sm:justify-end",
            )}
          >
            {showAllowance && capability.allowance ? (
              <AllowanceDisplay parts={capability.allowance} />
            ) : null}
            {showAddKeys ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddKeys}
              >
                Add keys
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

function ApiKeyField({
  id,
  label,
  placeholder,
  helper,
  masked,
  value,
  isPending,
  onChange,
  onClear,
}: {
  id: string;
  label: string;
  placeholder: string;
  helper: string;
  masked: string | null;
  value: string;
  isPending: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {masked ? (
        <div className="mt-2 flex items-center gap-2">
          <code className="bg-muted rounded-md px-2 py-1 text-xs">{masked}</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={onClear}
          >
            Remove
          </Button>
        </div>
      ) : null}
      <Input
        id={id}
        type="password"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        className={KEY_INPUT_CLASS}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground mt-2 text-xs">{helper}</p>
    </div>
  );
}

function ApiKeysSection({
  usage,
  openaiKey,
  elevenlabsKey,
  keysBlocked,
  onOpenaiKeyChange,
  onElevenlabsKeyChange,
  onSave,
  onClear,
  isPending,
  sectionRef,
  highlight,
}: {
  usage: QuotaUsageSummary;
  openaiKey: string;
  elevenlabsKey: string;
  keysBlocked: boolean;
  onOpenaiKeyChange: (value: string) => void;
  onElevenlabsKeyChange: (value: string) => void;
  onSave: () => void;
  onClear: (provider: "openai" | "elevenlabs") => void;
  isPending: boolean;
  sectionRef: React.RefObject<HTMLDivElement | null>;
  highlight: boolean;
}) {
  const canSave =
    openaiKey.trim().length > 0 || elevenlabsKey.trim().length > 0;

  return (
    <div
      ref={sectionRef}
      className={cn(
        highlight &&
          "ring-primary/40 rounded-3xl ring-2 ring-offset-2 ring-offset-background",
      )}
    >
      <SettingsGroup>
        <div className="px-4 py-4">
          <SettingsField
            label="Your API keys"
            description={
              keysBlocked
                ? "Add the keys below to keep using Orin after your free allowance."
                : "Save keys now so chat, voice, and read aloud continue automatically when limits are reached."
            }
          >
            <div className="space-y-6">
              <ApiKeyField
                id="openai-key"
                label="OpenAI"
                placeholder="sk-..."
                helper="Powers text chat and voice responses."
                masked={
                  usage.keys.hasOpenaiKey ? usage.keys.openaiMasked : null
                }
                value={openaiKey}
                isPending={isPending}
                onChange={onOpenaiKeyChange}
                onClear={() => onClear("openai")}
              />
              <ApiKeyField
                id="elevenlabs-key"
                label="ElevenLabs"
                placeholder="sk_..."
                helper="Powers voice calls and read aloud."
                masked={
                  usage.keys.hasElevenlabsKey
                    ? usage.keys.elevenlabsMasked
                    : null
                }
                value={elevenlabsKey}
                isPending={isPending}
                onChange={onElevenlabsKeyChange}
                onClear={() => onClear("elevenlabs")}
              />
              <Button
                type="button"
                size="sm"
                disabled={isPending || !canSave}
                onClick={onSave}
              >
                {isPending ? "Verifying..." : "Save and verify keys"}
              </Button>
            </div>
          </SettingsField>
        </div>
      </SettingsGroup>
    </div>
  );
}

export function SettingsUsage() {
  const userId = useAuthStore((state) => state.userId);
  const usage = useUsageStore((state) => state.usage);
  const isLoading = useUsageStore((state) => state.isLoading);
  const refreshUsage = useUsageStore((state) => state.refresh);
  const [openaiKey, setOpenaiKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [highlightKeys, setHighlightKeys] = useState(false);
  const keysSectionRef = useRef<HTMLDivElement>(null);

  const scrollToKeys = useCallback(() => {
    keysSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setHighlightKeys(true);
    window.setTimeout(() => setHighlightKeys(false), 2_000);
  }, []);

  const hasEdits =
    openaiKey.trim().length > 0 || elevenlabsKey.trim().length > 0;

  const discardEdits = useCallback(() => {
    setOpenaiKey("");
    setElevenlabsKey("");
  }, []);

  useSettingsRouteDirty("usage", hasEdits, discardEdits);

  const handleSaveKeys = () => {
    startTransition(async () => {
      const payload: { openaiKey?: string; elevenlabsKey?: string } = {};

      if (openaiKey.trim()) {
        payload.openaiKey = openaiKey.trim();
      }
      if (elevenlabsKey.trim()) {
        payload.elevenlabsKey = elevenlabsKey.trim();
      }

      if (Object.keys(payload).length === 0) {
        toast.error("Enter at least one API key to save");
        return;
      }

      const response = await fetch("/api/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        toast.error(body?.error ?? "Failed to save API keys");
        return;
      }

      setOpenaiKey("");
      setElevenlabsKey("");
      toast.success("API keys verified and saved");
      await refreshUsage();
    });
  };

  const handleClearKey = (provider: "openai" | "elevenlabs") => {
    startTransition(async () => {
      const response = await fetch(`/api/keys?provider=${provider}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Failed to remove API key");
        return;
      }

      toast.success("API key removed");
      await refreshUsage();
    });
  };

  if (userId === undefined || (isLoading && !usage)) {
    return <SettingsSkeletonRows count={2} />;
  }

  const capabilities = usage ? buildCapabilitySnapshots(usage) : [];
  const keysBlocked = capabilities.some(
    (capability) => capability.kind === "blocked",
  );

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <SettingsSectionIntro
          title={userId ? "Free allowance" : "Free to try"}
          description={
            userId
              ? "Platform-provided usage for text chat, voice, and read aloud. Add your own keys when it runs out."
              : "A small demo allowance in this browser. Sign up for voice, read aloud, and more."
          }
        />
        {capabilities.map((capability, index) => (
          <CapabilityRow
            key={capability.id}
            capability={capability}
            withSeparator={index > 0}
            onAddKeys={userId ? scrollToKeys : undefined}
          />
        ))}
      </SettingsGroup>

      {!userId ? (
        <>
          <SettingsSignInPrompt
            title="Sign up to unlock more"
            description="Voice calls, read aloud, higher limits, and the option to add your own API keys when the free allowance runs out."
          />
          <Button asChild>
            <SignUpWithGoogleLink />
          </Button>
        </>
      ) : usage ? (
        <ApiKeysSection
          usage={usage}
          openaiKey={openaiKey}
          elevenlabsKey={elevenlabsKey}
          keysBlocked={keysBlocked}
          onOpenaiKeyChange={setOpenaiKey}
          onElevenlabsKeyChange={setElevenlabsKey}
          onSave={handleSaveKeys}
          onClear={handleClearKey}
          isPending={isPending}
          sectionRef={keysSectionRef}
          highlight={highlightKeys}
        />
      ) : null}
    </SettingsPage>
  );
}
