"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import {
  SettingsEmptyState,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsRow,
  SettingsSignInPrompt,
  SettingsSkeletonRows,
  SettingsStat,
} from "@/components/settings/settings-ui";
import { toast } from "@/components/nexus-ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { QuotaOperation, QuotaUsageSummary } from "@/lib/quotas/types";

const OPERATION_LABELS: Record<QuotaOperation, string> = {
  new_conversation: "New chats",
  message_turn: "Messages sent",
  voice_session: "Voice calls",
  read_aloud: "Read aloud",
};

type MaskedKeys = {
  openaiMasked: string | null;
  elevenlabsMasked: string | null;
  hasOpenaiKey: boolean;
  hasElevenlabsKey: boolean;
};

export function SettingsUsage() {
  const userId = useAuthStore((state) => state.userId);
  const [usage, setUsage] = useState<QuotaUsageSummary | null>(null);
  const [keys, setKeys] = useState<MaskedKeys | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [elevenlabsKey, setElevenlabsKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const [usageResponse, keysResponse] = await Promise.all([
        fetch("/api/usage", { cache: "no-store" }),
        userId
          ? fetch("/api/keys", { cache: "no-store" })
          : Promise.resolve(null),
      ]);

      if (usageResponse.ok) {
        const data = (await usageResponse.json()) as { usage: QuotaUsageSummary };
        setUsage(data.usage);
      }

      if (keysResponse?.ok) {
        const data = (await keysResponse.json()) as { keys: MaskedKeys };
        setKeys(data.keys);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId === undefined) {
      return;
    }

    void loadData();
  }, [loadData, userId]);

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
      toast.success("API keys saved");
      await loadData();
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
      await loadData();
    });
  };

  if (userId === undefined) {
    return <SettingsSkeletonRows count={2} />;
  }

  if (userId === null) {
    return (
      <SettingsPage>
        <SettingsSignInPrompt
          title="Sign in to view usage"
          description="Track your free allowance and add your own API keys after limits are reached."
        />
        <Button asChild>
          <Link href="/auth/login">Sign in with Google</Link>
        </Button>
      </SettingsPage>
    );
  }

  const operations = Object.keys(OPERATION_LABELS) as QuotaOperation[];

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <SettingsRow
          title="Free allowance"
          description="Platform-provided usage before your own API keys are needed."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {operations.map((operation) => (
              <SettingsStat
                key={operation}
                loading={isLoading && !usage}
                value={usage?.remaining[operation] ?? 0}
                label={`${OPERATION_LABELS[operation]} left`}
              />
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          title="Used"
          description="Operations counted against your free allowance."
          withSeparator
        >
          {usage ? (
            <div className="grid gap-2 text-sm">
              {operations.map((operation) => (
                <div
                  key={operation}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-muted-foreground">
                    {OPERATION_LABELS[operation]}
                  </span>
                  <span className="font-medium tabular-nums">
                    {usage.used[operation]} / {usage.limits[operation]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <SettingsEmptyState>
              {isLoading ? "Loading usage..." : "No usage data yet."}
            </SettingsEmptyState>
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup>
        <div className="px-4 py-4">
          <SettingsField
            label="Bring your own keys"
            description="After the free allowance, add your OpenAI and ElevenLabs keys to keep chatting, calling, and using read aloud."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="openai-key" className="text-sm font-medium">
                  OpenAI API key
                </label>
                {keys?.hasOpenaiKey && keys.openaiMasked ? (
                  <div className="flex items-center gap-2">
                    <code className="bg-muted rounded-md px-2 py-1 text-xs">
                      {keys.openaiMasked}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleClearKey("openai")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
                <Input
                  id="openai-key"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-..."
                  value={openaiKey}
                  onChange={(event) => setOpenaiKey(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="elevenlabs-key" className="text-sm font-medium">
                  ElevenLabs API key
                </label>
                {keys?.hasElevenlabsKey && keys.elevenlabsMasked ? (
                  <div className="flex items-center gap-2">
                    <code className="bg-muted rounded-md px-2 py-1 text-xs">
                      {keys.elevenlabsMasked}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleClearKey("elevenlabs")}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
                <Input
                  id="elevenlabs-key"
                  type="password"
                  autoComplete="off"
                  placeholder="xi-..."
                  value={elevenlabsKey}
                  onChange={(event) => setElevenlabsKey(event.target.value)}
                />
              </div>

              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleSaveKeys}
              >
                {isPending ? "Saving..." : "Save API keys"}
              </Button>
            </div>
          </SettingsField>
        </div>
      </SettingsGroup>
    </SettingsPage>
  );
}
