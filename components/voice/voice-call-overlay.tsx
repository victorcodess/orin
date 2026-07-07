"use client";

import { useConversation, useConversationInput } from "@elevenlabs/react";
import {
  Cancel01Icon,
  Mic01Icon,
  MicOff01Icon,
  ExpandIcon,
  CollapseIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

import { Orb } from "@/components/elevenlabs/orb";
import {
  useVoiceOrb,
  type VoiceActivity,
} from "@/components/voice/use-voice-orb";
import {
  VoiceCallTooltip,
  voiceCallEndKeys,
  voiceCallModeKeys,
  voiceCallMuteKeys,
} from "@/components/voice/voice-call-keyboard-shortcuts";
import { VoiceActivityIndicator } from "@/components/voice/voice-activity-indicator";
import { VoiceSilenceWarning } from "@/components/voice/voice-silence-warning";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/nexus-ui/toaster";
import { isFetchError, readErrorResponse } from "@/lib/quotas/client-errors";
import { toastQuotaError } from "@/lib/quotas/toast";
import type { KeySource } from "@/lib/quotas/types";
import { getVoiceOrbColors } from "@/lib/elevenlabs/voices";
import { useAssistantConfig } from "@/lib/stores/assistant-config-store";
import {
  useVoiceCallStore,
  type VoiceCallMode,
} from "@/lib/stores/voice-call-store";
import { ORIN_NAME } from "@/lib/orin/defaults";
import { useVoiceLiveMessagesStore } from "@/lib/stores/voice-live-messages-store";
import { getVoiceDisconnectToast } from "@/lib/voice/disconnect-toast";
import { patchElevenLabsErrorHandler } from "@/lib/voice/elevenlabs-error-handler";
import { cn } from "@/lib/utils";

const CLIENT_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

patchElevenLabsErrorHandler();

// A muted WebRTC mic still sends silence frames, which ElevenLabs occasionally
// emits as an empty "..." user turn. Ignore turns with no letters/digits so a
// muted (or silent) mic never surfaces a bubble.
function hasSpeech(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function reportVoiceCallComplete(
  conversationId: string | null,
  activeSince: number | null,
  keySource: KeySource,
  voiceSessionId: string | null,
) {
  if (!conversationId || activeSince == null) {
    return;
  }

  const durationSeconds = Math.round((Date.now() - activeSince) / 1000);
  if (durationSeconds < 1) {
    return;
  }

  void fetch("/api/voice/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      durationSeconds,
      keySource,
      voiceSessionId: voiceSessionId ?? undefined,
    }),
  });
}

async function ensureNewChatConversation(conversationId: string) {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: conversationId }),
  });

  if (!response.ok) {
    throw await readErrorResponse(response);
  }
}

function VoiceCallControls({
  mode,
  canToggleMute,
  onToggleMode,
  onEnd,
}: {
  mode: VoiceCallMode;
  canToggleMute: boolean;
  onToggleMode: () => void;
  onEnd: () => void;
}) {
  const { isMuted, setMuted } = useConversationInput();

  const muteLabel = isMuted ? "Unmute microphone" : "Mute microphone";
  const modeLabel = mode === "fullscreen" ? "Minimize call" : "Expand call";

  return (
    <div className="absolute inset-x-0 bottom-0 flex w-full items-center justify-between gap-2 px-6 pb-13.5 lg:px-12 lg:pb-16">
      <div className="flex items-center gap-2">
        <VoiceCallTooltip label={muteLabel} keys={voiceCallMuteKeys()}>
          <Button
            type="button"
            variant="secondary"
            size="icon-xl"
            disabled={!canToggleMute}
            aria-label={muteLabel}
            onClick={() => setMuted(!isMuted)}
          >
            <HugeiconsIcon
              icon={isMuted ? MicOff01Icon : Mic01Icon}
              strokeWidth={2}
              className="size-5.5 shrink-0"
            />
          </Button>
        </VoiceCallTooltip>
        <VoiceCallTooltip label={modeLabel} keys={voiceCallModeKeys()}>
          <Button
            type="button"
            variant="secondary"
            size="icon-xl"
            aria-label={modeLabel}
            onClick={onToggleMode}
          >
            <HugeiconsIcon
              icon={mode === "fullscreen" ? CollapseIcon : ExpandIcon}
              strokeWidth={2}
              className="size-5.5 shrink-0"
            />
          </Button>
        </VoiceCallTooltip>
      </div>
      <VoiceCallTooltip label="End call" keys={voiceCallEndKeys()}>
        <Button
          type="button"
          variant="destructive"
          size="icon-xl"
          aria-label="End call"
          onClick={onEnd}
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-5.5 shrink-0"
          />
        </Button>
      </VoiceCallTooltip>
    </div>
  );
}

function VoiceCallPanel({
  mode,
  activity,
  agentState,
  volumeMode,
  getInputVolume,
  getOutputVolume,
  assistantName,
  onToggleMode,
  onEnd,
}: {
  mode: VoiceCallMode;
  activity: VoiceActivity;
  agentState: ReturnType<typeof useVoiceOrb>["agentState"];
  volumeMode: "auto" | "manual";
  getInputVolume: () => number;
  getOutputVolume: () => number;
  assistantName: string;
  onToggleMode: () => void;
  onEnd: () => void;
}) {
  const { voiceId } = useAssistantConfig();
  const isFullscreen = mode === "fullscreen";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        isFullscreen
          ? "relative h-full w-full justify-center px-6 py-10"
          : "px-4 pt-3 pb-4"
      )}
    >
      <div className="-mt-40 flex flex-col items-center gap-10">
        <Orb
          className={cn(
            "size-32",
            isFullscreen && "size-64",
            "outline-border/10 rounded-full outline-10"
          )}
          agentState={agentState}
          volumeMode={volumeMode}
          getInputVolume={getInputVolume}
          getOutputVolume={getOutputVolume}
          colors={getVoiceOrbColors(voiceId)}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-foreground hidden text-base font-medium">
            {assistantName}
          </p>
          <VoiceActivityIndicator activity={activity} />
        </div>
      </div>

      <VoiceCallControls
        mode={mode}
        canToggleMute={activity !== "connecting"}
        onToggleMode={onToggleMode}
        onEnd={onEnd}
      />
    </div>
  );
}

export function VoiceCallOverlay() {
  const status = useVoiceCallStore((state) => state.status);
  const mode = useVoiceCallStore((state) => state.mode);
  const conversationId = useVoiceCallStore((state) => state.conversationId);
  const reset = useVoiceCallStore((state) => state.reset);
  const setActive = useVoiceCallStore((state) => state.setActive);
  const setPendingToken = useVoiceCallStore((state) => state.setPendingToken);
  const setError = useVoiceCallStore((state) => state.setError);
  const toggleMode = useVoiceCallStore((state) => state.toggleMode);
  const setDisconnecting = useVoiceCallStore((state) => state.setDisconnecting);
  const bindLiveConversation = useVoiceLiveMessagesStore(
    (state) => state.bindConversation
  );
  const setUserTranscript = useVoiceLiveMessagesStore(
    (state) => state.setUserTranscript
  );
  const applyAgentPart = useVoiceLiveMessagesStore(
    (state) => state.applyAgentPart
  );
  const setAgentTranscript = useVoiceLiveMessagesStore(
    (state) => state.setAgentTranscript
  );

  const bindTokenRef = useRef<string | null>(null);
  const keySourceRef = useRef<KeySource>("platform");
  const conversationIdRef = useRef<string | null>(null);
  const sessionStartingRef = useRef(false);
  const bindSucceededRef = useRef(false);
  const completionReportedRef = useRef(false);
  const voiceSessionIdRef = useRef<string | null>(null);
  const lastErrorAtRef = useRef<number | null>(null);

  conversationIdRef.current = conversationId;

  const resetCallRefs = () => {
    sessionStartingRef.current = false;
    bindTokenRef.current = null;
    bindSucceededRef.current = false;
    completionReportedRef.current = false;
    voiceSessionIdRef.current = null;
    keySourceRef.current = "platform";
  };

  const reportCallCompleteOnce = (
    activeConversationId: string | null,
    activeSince: number | null,
  ) => {
    if (completionReportedRef.current) {
      return;
    }

    completionReportedRef.current = true;
    reportVoiceCallComplete(
      activeConversationId,
      activeSince,
      keySourceRef.current,
      voiceSessionIdRef.current,
    );
  };

  const conversation = useConversation({
    onMessage: ({ role, message }) => {
      if (role === "user") {
        // Drop empty/silence turns (e.g. from a muted mic) so they never flash
        // a bubble; the server ignores them too.
        if (hasSpeech(message)) {
          useVoiceCallStore.getState().markUserSpeaking();
          setUserTranscript(message);
        }
        return;
      }

      setAgentTranscript(message);
    },
    onVadScore: ({ vadScore }) => {
      if (vadScore > 0.35) {
        useVoiceCallStore.getState().markUserSpeaking();
      }
    },
    onModeChange: ({ mode }) => {
      const store = useVoiceCallStore.getState();
      store.setAgentListening(mode === "listening");
      if (mode === "listening") {
        store.startSilenceClock();
      } else {
        store.clearSilenceClock();
      }
    },
    onAgentChatResponsePart: (part) => {
      applyAgentPart(part);
    },
    onInterruption: () => {
      applyAgentPart({ text: "", type: "stop" });
    },
    onConnect: async ({ conversationId: voiceSessionId }) => {
      const activeConversationId = conversationIdRef.current;
      const token =
        bindTokenRef.current ?? useVoiceCallStore.getState().pendingToken;

      if (!activeConversationId || !token) {
        conversationRef.current.endSession();
        setError("Voice session binding failed");
        toast.error("Could not start voice call", {
          description: "Missing session token. Try again.",
        });
        reset();
        return;
      }

      try {
        const response = await fetch("/api/voice/bind", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: activeConversationId,
            pendingToken: token,
            voiceSessionId,
          }),
        });

        if (!response.ok) {
          throw await readErrorResponse(response);
        }

        voiceSessionIdRef.current = voiceSessionId;
        bindSucceededRef.current = true;
        bindTokenRef.current = null;
        setActive();
      } catch (error) {
        bindTokenRef.current = null;
        conversation.endSession();
        setError(
          error instanceof Error ? error.message : "Failed to start call"
        );
        toast.error("Could not start voice call");
      }
    },
    onDisconnect: (details) => {
      sessionStartingRef.current = false;
      toast.dismiss("voice-silence-countdown");

      const state = useVoiceCallStore.getState();

      // WebRTC can emit a disconnect before onConnect/bind finishes. Resetting
      // here would wipe the pending token and leave a connected call unbound.
      if (state.status === "connecting" && !bindSucceededRef.current) {
        return;
      }

      if (state.status !== "disconnecting") {
        const {
          lastUserSpeechAt,
          silenceEndCallTimeout,
          activeSince,
        } = state;
        const recentError =
          lastErrorAtRef.current != null &&
          Date.now() - lastErrorAtRef.current < 5_000;
        const toastInfo = getVoiceDisconnectToast(details, {
          recentError,
          activeSince,
          lastUserSpeechAt,
          silenceEndCallTimeout,
        });

        switch (toastInfo.kind) {
          case "silence":
            toast.info("Call ended due to silence", {
              description: "Speak during the call to keep it open.",
              position: "bottom-right",
            });
            break;
          case "ended":
            toast.info("Call ended", {
              description: toastInfo.description,
              position: "bottom-right",
            });
            break;
          case "error":
            toast.error(toastInfo.title, {
              description: toastInfo.description,
            });
            break;
          case "none":
            break;
        }
      }

      lastErrorAtRef.current = null;

      if (state.status === "active" || state.status === "disconnecting") {
        reportCallCompleteOnce(
          state.conversationId,
          state.activeSince,
        );
      }

      bindTokenRef.current = null;
      reset();
    },
    onError: (message, context) => {
      sessionStartingRef.current = false;
      lastErrorAtRef.current = Date.now();
      conversation.endSession();
      setError(message);

      const description =
        typeof context === "object" && context != null
          ? [
              "debugMessage" in context &&
              typeof context.debugMessage === "string"
                ? context.debugMessage
                : null,
              "details" in context && typeof context.details === "string"
                ? context.details
                : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          : undefined;

      toast.error("Voice call error", {
        description: description ?? message,
      });
    },
  });

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  useEffect(() => {
    if (status !== "connecting" || !conversationId) {
      if (status === "idle") {
        resetCallRefs();
      }
      return;
    }

    if (sessionStartingRef.current) {
      return;
    }

    sessionStartingRef.current = true;
    bindSucceededRef.current = false;
    completionReportedRef.current = false;
    bindTokenRef.current = null;
    voiceSessionIdRef.current = null;
    bindLiveConversation(conversationId);
    let cancelled = false;

    void (async () => {
      try {
        const { origin } = useVoiceCallStore.getState();

        if (origin === "new-chat") {
          await ensureNewChatConversation(conversationId);
        }

        const response = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            timeZone: CLIENT_TIME_ZONE,
          }),
        });

        if (!response.ok) {
          throw await readErrorResponse(response);
        }

        const data = (await response.json()) as {
          token?: string;
          pendingToken?: string;
          silenceEndCallTimeout?: number | null;
          keySource?: KeySource;
        };

        if (cancelled) {
          return;
        }

        if (!data.token || !data.pendingToken) {
          throw new Error("Failed to create voice token");
        }

        bindTokenRef.current = data.pendingToken;
        keySourceRef.current = data.keySource ?? "platform";
        setPendingToken(
          data.pendingToken,
          data.silenceEndCallTimeout ?? null
        );
        await navigator.mediaDevices.getUserMedia({ audio: true });

        if (cancelled) {
          return;
        }

        conversationRef.current.startSession({
          conversationToken: data.token,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        sessionStartingRef.current = false;
        const message =
          error instanceof Error ? error.message : "Failed to start voice call";
        setError(message);
        if (isFetchError(error)) {
          toastQuotaError(error);
        } else {
          toast.error("Could not start voice call", { description: message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bindLiveConversation, conversationId, setError, setPendingToken, status]);

  useEffect(() => {
    if (status !== "active") {
      return;
    }

    if (conversation.status !== "error") {
      return;
    }

    sessionStartingRef.current = false;
    conversation.endSession();
    setError("Voice connection lost");
    toast.error("Voice call disconnected");
    reset();
  }, [conversation, reset, setError, status]);

  // Tearing down on "disconnecting" (rather than inline in the click handler)
  // means a call can be ended mid-connect: it cancels the pending start and, by
  // clearing the refs + resetting, stops onConnect from re-activating the call.
  useEffect(() => {
    if (status !== "disconnecting") {
      return;
    }

    const { conversationId: activeId, activeSince } = useVoiceCallStore.getState();
    reportCallCompleteOnce(activeId, activeSince);

    const pendingToken = bindTokenRef.current;
    if (pendingToken && !bindSucceededRef.current && activeId) {
      void fetch("/api/voice/clear-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, pendingToken }),
      });
    }

    resetCallRefs();
    conversationRef.current.endSession();
    reset();
  }, [status, reset]);

  const handleEnd = () => {
    setDisconnecting();
  };

  const assistantName = ORIN_NAME;

  // Inline calls are rendered by the chat composer (ChatInput); the overlay only
  // owns the fullscreen experience plus the conversation lifecycle.
  const showFullscreen = status !== "idle" && mode === "fullscreen";

  return (
    <>
      {status !== "idle" ? <VoiceSilenceWarning /> : null}
      <AnimatePresence>
        {showFullscreen ? (
          <motion.div
            key="voice-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-background fixed inset-0 z-50 flex items-center justify-center backdrop-blur-3xl"
          >
            <FullscreenCallPanel
              assistantName={assistantName}
              onToggleMode={toggleMode}
              onEnd={handleEnd}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function FullscreenCallPanel({
  assistantName,
  onToggleMode,
  onEnd,
}: {
  assistantName: string;
  onToggleMode: () => void;
  onEnd: () => void;
}) {
  const { activity, agentState, volumeMode, getInputVolume, getOutputVolume } =
    useVoiceOrb();

  return (
    <VoiceCallPanel
      mode="fullscreen"
      activity={activity}
      agentState={agentState}
      volumeMode={volumeMode}
      getInputVolume={getInputVolume}
      getOutputVolume={getOutputVolume}
      assistantName={assistantName}
      onToggleMode={onToggleMode}
      onEnd={onEnd}
    />
  );
}
