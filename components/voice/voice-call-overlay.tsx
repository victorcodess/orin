"use client";

import { useConversation, useConversationInput } from "@elevenlabs/react";
import {
  Cancel01Icon,
  Maximize01Icon,
  Mic01Icon,
  MicOff01Icon,
  Minimize01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/nexus-ui/toaster";
import {
  useVoiceCallStore,
  type VoiceCallMode,
} from "@/lib/stores/voice-call-store";
import { useVoiceLiveMessagesStore } from "@/lib/stores/voice-live-messages-store";
import { cn } from "@/lib/utils";

type VoiceActivity = "connecting" | "idle" | "listening" | "talking";

const activityStyles: Record<
  VoiceActivity,
  { label: string; dotClass: string; ringClass: string }
> = {
  connecting: {
    label: "Connecting",
    dotClass: "bg-muted-foreground",
    ringClass: "border-muted-foreground/30",
  },
  idle: {
    label: "Ready",
    dotClass: "bg-muted-foreground",
    ringClass: "border-muted-foreground/20",
  },
  listening: {
    label: "Listening",
    dotClass: "bg-emerald-500",
    ringClass: "border-emerald-500/35",
  },
  talking: {
    label: "Speaking",
    dotClass: "bg-sky-500",
    ringClass: "border-sky-500/35",
  },
};

function resolveVoiceActivity({
  callStatus,
  connectionStatus,
  isSpeaking,
  isListening,
  isMuted,
}: {
  callStatus: string;
  connectionStatus: string;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
}): VoiceActivity {
  // Drive the indicator off the real ElevenLabs connection state so it tracks
  // audio immediately, rather than waiting for our own bind round-trip to flip
  // the app status to "active".
  if (connectionStatus === "connected") {
    if (isSpeaking) {
      return "talking";
    }

    if (isMuted) {
      return "idle";
    }

    if (isListening) {
      return "listening";
    }

    return "idle";
  }

  if (callStatus === "disconnecting") {
    return "connecting";
  }

  return "connecting";
}

function VoiceActivityIndicator({ activity }: { activity: VoiceActivity }) {
  const styles = activityStyles[activity];
  const pulse = activity === "listening" || activity === "talking";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
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
        <span className={cn("relative inline-flex size-2 rounded-full", styles.dotClass)} />
      </span>
      <span className="text-foreground">{styles.label}</span>
    </div>
  );
}

function VoiceOrb({ activity }: { activity: VoiceActivity }) {
  const active = activity === "listening" || activity === "talking";
  const orbClass =
    activity === "talking"
      ? "bg-sky-500/25"
      : activity === "listening"
        ? "bg-emerald-500/20"
        : "bg-primary/20";

  return (
    <div className="relative flex size-28 items-center justify-center">
      <motion.div
        className={cn("absolute inset-0 rounded-full", orbClass)}
        animate={
          active
            ? { scale: [1, 1.12, 1], opacity: [0.45, 0.8, 0.45] }
            : { scale: 1, opacity: 0.35 }
        }
        transition={{
          duration: activity === "talking" ? 1.2 : 1.8,
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn("absolute inset-4 rounded-full", orbClass)}
        animate={
          active
            ? { scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] }
            : { scale: 1, opacity: 0.45 }
        }
        transition={{
          duration: activity === "talking" ? 1 : 1.4,
          repeat: active ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.15,
        }}
      />
      <div className="bg-primary text-primary-foreground relative flex size-16 items-center justify-center rounded-full shadow-lg">
        <HugeiconsIcon icon={Mic01Icon} strokeWidth={2} className="size-7 shrink-0" />
      </div>
    </div>
  );
}

function VoiceCallControls({
  mode,
  onToggleMode,
  onEnd,
}: {
  mode: VoiceCallMode;
  onToggleMode: () => void;
  onEnd: () => void;
}) {
  const { isMuted, setMuted } = useConversationInput();

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        onClick={() => setMuted(!isMuted)}
      >
        <HugeiconsIcon
          icon={isMuted ? MicOff01Icon : Mic01Icon}
          strokeWidth={2}
          className="size-4.75 shrink-0"
        />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon-lg"
        aria-label={mode === "fullscreen" ? "Minimize call" : "Expand call"}
        onClick={onToggleMode}
      >
        <HugeiconsIcon
          icon={mode === "fullscreen" ? Minimize01Icon : Maximize01Icon}
          strokeWidth={2}
          className="size-4.75 shrink-0"
        />
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon-lg"
        aria-label="End call"
        onClick={onEnd}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4.75 shrink-0" />
      </Button>
    </div>
  );
}

function VoiceCallPanel({
  mode,
  activity,
  assistantName,
  onToggleMode,
  onEnd,
}: {
  mode: VoiceCallMode;
  activity: VoiceActivity;
  assistantName: string;
  onToggleMode: () => void;
  onEnd: () => void;
}) {
  const isFullscreen = mode === "fullscreen";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        isFullscreen ? "px-6 py-10" : "px-4 py-4",
      )}
    >
      <VoiceOrb activity={activity} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-foreground text-base font-medium">{assistantName}</p>
        <VoiceActivityIndicator activity={activity} />
      </div>
      <VoiceCallControls mode={mode} onToggleMode={onToggleMode} onEnd={onEnd} />
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
  const applyAgentPart = useVoiceLiveMessagesStore((state) => state.applyAgentPart);
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
        setUserTranscript(message);
        return;
      }

      setAgentTranscript(message);
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
        setError(error instanceof Error ? error.message : "Failed to start call");
        toast.error("Could not start voice call");
      }
    },
    onDisconnect: () => {
      sessionStartingRef.current = false;
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
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.token || !data.pendingToken || !data.assistant) {
          throw new Error(data.error ?? "Failed to create voice token");
        }

        pendingTokenRef.current = data.pendingToken;
        setPendingToken(data.pendingToken, data.assistant);
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

    if (conversation.status !== "disconnected" && conversation.status !== "error") {
      return;
    }

    sessionStartingRef.current = false;
    conversation.endSession();
    setError("Voice connection lost");
    toast.error("Voice call disconnected");
    reset();
  }, [conversation, reset, setError, status]);

  const handleEnd = () => {
    setDisconnecting();
    sessionStartingRef.current = false;
    pendingTokenRef.current = null;
    conversation.endSession();
    reset();
  };

  if (status === "idle") {
    return null;
  }

  const assistantName = assistant?.name ?? "Orin";
  const activity = resolveVoiceActivity({
    callStatus: status,
    connectionStatus: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isListening: conversation.isListening,
    isMuted: conversation.isMuted,
  });

  if (mode === "fullscreen") {
    return (
      <div className="bg-background/95 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <VoiceCallPanel
          mode={mode}
          activity={activity}
          assistantName={assistantName}
          onToggleMode={toggleMode}
          onEnd={handleEnd}
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4 md:bottom-30">
      <div className="bg-card pointer-events-auto w-full max-w-3xl rounded-3xl border shadow-lg">
        <VoiceCallPanel
          mode={mode}
          activity={activity}
          assistantName={assistantName}
          onToggleMode={toggleMode}
          onEnd={handleEnd}
        />
      </div>
    </div>
  );
}
