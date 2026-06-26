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
import { useVoiceOrb, type VoiceActivity } from "@/components/voice/use-voice-orb";
import {
  VoiceCallTooltip,
  voiceCallEndKeys,
  voiceCallModeKeys,
  voiceCallMuteKeys,
} from "@/components/voice/voice-call-keyboard-shortcuts";
import { VoiceSilenceWarning } from "@/components/voice/voice-silence-warning";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/nexus-ui/toaster";
import {
  useVoiceCallStore,
  type VoiceCallMode,
} from "@/lib/stores/voice-call-store";
import { useVoiceLiveMessagesStore } from "@/lib/stores/voice-live-messages-store";
import { cn } from "@/lib/utils";

// A muted WebRTC mic still sends silence frames, which ElevenLabs occasionally
// emits as an empty "..." user turn. Ignore turns with no letters/digits so a
// muted (or silent) mic never surfaces a bubble.
function hasSpeech(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

const activityStyles: Record<
  VoiceActivity,
  { label: string; dotClass: string; ringClass: string }
> = {
  connecting: {
    label: "Connecting",
    dotClass: "bg-muted-foreground",
    ringClass: "bg-muted-foreground/15 dark:bg-muted-foreground/30",
  },
  idle: {
    label: "Ready",
    dotClass: "bg-muted-foreground",
    ringClass: "bg-muted-foreground/15 dark:bg-muted-foreground/30",
  },
  listening: {
    label: "Listening",
    dotClass: "bg-chart-2",
    ringClass: "bg-chart-2/15 dark:bg-chart-2/25",
  },
  talking: {
    label: "Speaking",
    dotClass: "bg-chart-3",
    ringClass: "bg-chart-3/15 dark:bg-chart-3/25",
  },
};

function VoiceActivityIndicator({ activity }: { activity: VoiceActivity }) {
  const styles = activityStyles[activity];
  const pulse = activity === "listening" || activity === "talking";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        styles.ringClass,
      )}
      aria-live="polite"
    >
      <span className="relative flex size-2">
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-60",
              styles.dotClass,
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            styles.dotClass,
          )}
        />
      </span>
      <span className="text-foreground">{styles.label}</span>
    </div>
  );
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
    <div className="absolute inset-x-0 bottom-0 flex w-full items-center justify-between gap-2 pb-13.5 px-6 lg:pb-16 lg:px-12">
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
  const isFullscreen = mode === "fullscreen";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        isFullscreen
          ? "relative h-full w-full justify-center px-6 py-10"
          : "px-4 pt-3 pb-4",
      )}
    >
      <div className="-mt-40 flex flex-col items-center gap-10">
        <Orb
          className={cn(
            "size-32",
            isFullscreen && "size-64",
            "outline-border/10 rounded-full outline-10",
          )}
          agentState={agentState}
          volumeMode={volumeMode}
          getInputVolume={getInputVolume}
          getOutputVolume={getOutputVolume}
          colors={["#f97015", "#fcf8f3"]}
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
  const assistant = useVoiceCallStore((state) => state.assistant);
  const reset = useVoiceCallStore((state) => state.reset);
  const setActive = useVoiceCallStore((state) => state.setActive);
  const setPendingToken = useVoiceCallStore((state) => state.setPendingToken);
  const setError = useVoiceCallStore((state) => state.setError);
  const toggleMode = useVoiceCallStore((state) => state.toggleMode);
  const setDisconnecting = useVoiceCallStore((state) => state.setDisconnecting);
  const bindLiveConversation = useVoiceLiveMessagesStore(
    (state) => state.bindConversation,
  );
  const setUserTranscript = useVoiceLiveMessagesStore(
    (state) => state.setUserTranscript,
  );
  const applyAgentPart = useVoiceLiveMessagesStore(
    (state) => state.applyAgentPart,
  );
  const setAgentTranscript = useVoiceLiveMessagesStore(
    (state) => state.setAgentTranscript,
  );

  const pendingTokenRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const sessionStartingRef = useRef(false);

  conversationIdRef.current = conversationId;

  const conversation = useConversation({
    onMessage: ({ role, message }) => {
      if (role === "user") {
        // Drop empty/silence turns (e.g. from a muted mic) so they never flash
        // a bubble; the server ignores them too.
        if (hasSpeech(message)) {
          useVoiceCallStore.getState().touchUserSpeech();
          setUserTranscript(message);
        }
        return;
      }

      setAgentTranscript(message);
    },
    onModeChange: ({ mode }) => {
      useVoiceCallStore.getState().setAgentListening(mode === "listening");
    },
    onAgentChatResponsePart: (part) => {
      applyAgentPart(part);
    },
    onInterruption: () => {
      applyAgentPart({ text: "", type: "stop" });
    },
    onConnect: async ({ conversationId: voiceSessionId }) => {
      const activeConversationId = conversationIdRef.current;
      const token = pendingTokenRef.current;

      if (!activeConversationId || !token) {
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
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to bind voice session");
        }

        setActive();
      } catch (error) {
        conversation.endSession();
        setError(
          error instanceof Error ? error.message : "Failed to start call",
        );
        toast.error("Could not start voice call");
      }
    },
    onDisconnect: (details) => {
      sessionStartingRef.current = false;
      toast.dismiss("voice-silence-countdown");
      if (useVoiceCallStore.getState().status !== "disconnecting") {
        if (details.reason === "agent") {
          toast.info("Call ended due to silence", {
            description: "Speak during the call to keep it open.",
          });
        } else if (details.reason === "error") {
          toast.error("Voice call disconnected", {
            description: details.message,
          });
        }
      }
      reset();
    },
    onError: (message) => {
      sessionStartingRef.current = false;
      conversation.endSession();
      setError(message);
      toast.error("Voice call error", { description: message });
    },
  });

  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  useEffect(() => {
    if (status !== "connecting" || !conversationId) {
      if (status === "idle") {
        sessionStartingRef.current = false;
        pendingTokenRef.current = null;
      }
      return;
    }

    if (sessionStartingRef.current) {
      return;
    }

    sessionStartingRef.current = true;
    bindLiveConversation(conversationId);
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/voice/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        });

        const data = (await response.json()) as {
          token?: string;
          pendingToken?: string;
          assistant?: {
            name: string;
            voiceId: string;
            firstMessage: string;
          };
          silenceEndCallTimeout?: number | null;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data.token ||
          !data.pendingToken ||
          !data.assistant
        ) {
          throw new Error(data.error ?? "Failed to create voice token");
        }

        pendingTokenRef.current = data.pendingToken;
        setPendingToken(
          data.pendingToken,
          data.assistant,
          data.silenceEndCallTimeout ?? null,
        );
        await navigator.mediaDevices.getUserMedia({ audio: true });

        if (cancelled) {
          return;
        }

        conversationRef.current.startSession({
          conversationToken: data.token,
          overrides: {
            agent: { firstMessage: data.assistant.firstMessage },
          },
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        sessionStartingRef.current = false;
        const message =
          error instanceof Error ? error.message : "Failed to start voice call";
        setError(message);
        toast.error("Could not start voice call", { description: message });
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

    sessionStartingRef.current = false;
    pendingTokenRef.current = null;
    conversationRef.current.endSession();
    reset();
  }, [status, reset]);

  const handleEnd = () => {
    setDisconnecting();
  };

  const assistantName = assistant?.name ?? "Orin";

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
