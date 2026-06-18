"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Mic02Icon, StopIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import {
  useScribe,
  type AudioFormat,
  type CommitStrategy,
} from "@/hooks/use-scribe";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const buttonVariants = cva("!px-0", {
  variants: {
    size: {
      default: "h-9 w-9",
      sm: "h-8 w-8",
      lg: "h-10 w-10",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type ButtonSize = VariantProps<typeof buttonVariants>["size"];

const EASE = [0.25, 0.1, 0.25, 1] as const;
const PREVIEW_WIDTH = 112;
const BUTTON_PX: Record<NonNullable<ButtonSize>, number> = {
  default: 36,
  sm: 32,
  lg: 40,
};

const BAR_DURATION = 0.22;
const BAR_STAGGER = 0.04;
const BAR_CLOSE_TOTAL = BAR_STAGGER + BAR_DURATION;
const MIC_REAPPEAR_DELAY = BAR_CLOSE_TOTAL + 0.06;

function barEnterTransition(
  reduceMotion: boolean | null,
  delay = 0
) {
  return reduceMotion
    ? { duration: 0 }
    : { duration: BAR_DURATION, ease: EASE, delay };
}

function barExitTransition(reduceMotion: boolean | null, delay = 0) {
  return reduceMotion
    ? { duration: 0 }
    : { duration: BAR_DURATION - 0.1, ease: EASE, delay };
}

function speechTransition(reduceMotion: boolean | null, duration = BAR_DURATION) {
  return reduceMotion ? { duration: 0 } : { duration, ease: EASE };
}

function useBarBackgroundVisible(
  isConnected: boolean,
  reduceMotion: boolean | null
) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (isConnected) {
      setVisible(true);
      return;
    }

    const delay = reduceMotion ? 0 : BAR_CLOSE_TOTAL * 1000;
    const id = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(id);
  }, [isConnected, reduceMotion]);

  return visible;
}

function micIconMotion(reduceMotion: boolean | null) {
  const blur = reduceMotion ? "blur(0px)" : "blur(6px)";

  return {
    initial: { opacity: 0, scale: 0.88, filter: blur },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.88,
      filter: blur,
      transition: speechTransition(reduceMotion, 0.15),
    },
    transition: speechTransition(reduceMotion, 0.2),
  } as const;
}

type TrailingSlotMode = "mic" | "cancel" | "connecting";

function useTrailingSlotMode(
  isConnected: boolean,
  isConnecting: boolean,
  reduceMotion: boolean | null
) {
  const [mode, setMode] = React.useState<TrailingSlotMode>("mic");
  const modeRef = React.useRef(mode);
  modeRef.current = mode;

  React.useEffect(() => {
    if (isConnecting) {
      setMode("connecting");
      return;
    }

    if (isConnected) {
      setMode("cancel");
      return;
    }

    if (modeRef.current === "cancel" || modeRef.current === "connecting") {
      const delay = reduceMotion ? 0 : MIC_REAPPEAR_DELAY * 1000;
      const id = window.setTimeout(() => setMode("mic"), delay);
      return () => window.clearTimeout(id);
    }

    setMode("mic");
  }, [isConnected, isConnecting, reduceMotion]);

  return mode;
}

export interface SpeechInputData {
  /** The current partial (in-progress) transcript */
  partialTranscript: string;
  /** Array of all committed (finalized) transcripts */
  committedTranscripts: string[];
  /** Full transcript combining committed and partial transcripts */
  transcript: string;
}

interface SpeechInputContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  transcript: string;
  partialTranscript: string;
  committedTranscripts: string[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  cancel: () => void;
  size: ButtonSize;
}

const SpeechInputContext = React.createContext<SpeechInputContextValue | null>(
  null
);

function useSpeechInput() {
  const context = React.useContext(SpeechInputContext);
  if (!context) {
    throw new Error(
      "SpeechInput compound components must be used within a SpeechInput"
    );
  }
  return context;
}

function buildTranscript({
  partialTranscript,
  committedTranscripts,
}: {
  partialTranscript: string;
  committedTranscripts: string[];
}): string {
  const committed = committedTranscripts.join(" ").trim();
  const partial = partialTranscript.trim();

  if (committed && partial) {
    return `${committed} ${partial}`;
  }
  return committed || partial;
}

function buildData({
  partialTranscript,
  committedTranscripts,
}: {
  partialTranscript: string;
  committedTranscripts: string[];
}): SpeechInputData {
  return {
    partialTranscript,
    committedTranscripts,
    transcript: buildTranscript({ partialTranscript, committedTranscripts }),
  };
}

export interface SpeechInputProps {
  children: React.ReactNode;

  /**
   * Function that returns a token for authenticating with the speech service.
   * This should be an async function that fetches a token from your backend.
   */
  getToken: () => Promise<string>;

  /**
   * Called whenever the transcript changes (partial or committed)
   */
  onChange?: (data: SpeechInputData) => void;

  /**
   * Called when recording is cancelled
   */
  onCancel?: (data: SpeechInputData) => void;

  /**
   * Called when recording starts
   */
  onStart?: (data: SpeechInputData) => void;

  /**
   * Called when recording stops
   */
  onStop?: (data: SpeechInputData) => void;

  /**
   * Additional CSS classes for the root container
   */
  className?: string;

  /**
   * Size variant for the component buttons
   * @default "default"
   */
  size?: ButtonSize;

  /**
   * Model ID for the speech recognition service
   * @default "scribe_v2_realtime"
   */
  modelId?: string;

  /**
   * Base URI for the speech recognition service
   */
  baseUri?: string;

  /**
   * Strategy for committing transcripts
   */
  commitStrategy?: CommitStrategy;

  /**
   * Silence threshold in seconds for VAD
   */
  vadSilenceThresholdSecs?: number;

  /**
   * VAD threshold value
   */
  vadThreshold?: number;

  /**
   * Minimum speech duration in milliseconds
   */
  minSpeechDurationMs?: number;

  /**
   * Minimum silence duration in milliseconds
   */
  minSilenceDurationMs?: number;

  /**
   * Language code for transcription (e.g., "en", "es", "fr")
   */
  languageCode?: string;

  /**
   * Microphone configuration options
   */
  microphone?: {
    deviceId?: string;
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
    channelCount?: number;
  };

  /**
   * Audio format for manual audio mode
   */
  audioFormat?: AudioFormat;

  /**
   * Sample rate for manual audio mode
   */
  sampleRate?: number;

  /**
   * Called when an error occurs
   */
  onError?: (error: Error | Event) => void;

  /**
   * Called when an authentication error occurs
   */
  onAuthError?: (data: { error: string }) => void;

  /**
   * Called when a quota exceeded error occurs
   */
  onQuotaExceededError?: (data: { error: string }) => void;
}

const SpeechInput = React.forwardRef<HTMLDivElement, SpeechInputProps>(
  function SpeechInput(
    {
      children,
      getToken,
      onChange,
      onCancel,
      onStart,
      onStop,
      className,
      size = "default",
      modelId = "scribe_v2_realtime",
      baseUri,
      commitStrategy,
      vadSilenceThresholdSecs,
      vadThreshold,
      minSpeechDurationMs,
      minSilenceDurationMs,
      languageCode,
      microphone = {
        echoCancellation: true,
        noiseSuppression: true,
      },
      audioFormat,
      sampleRate,
      onError,
      onAuthError,
      onQuotaExceededError,
    },
    ref
  ) {
    const transcriptsRef = React.useRef({
      partialTranscript: "",
      committedTranscripts: [] as string[],
    });
    const startRequestIdRef = React.useRef(0);
    const [isTokenPending, setIsTokenPending] = React.useState(false);

    const scribe = useScribe({
      modelId,
      baseUri,
      commitStrategy,
      vadSilenceThresholdSecs,
      vadThreshold,
      minSpeechDurationMs,
      minSilenceDurationMs,
      languageCode,
      audioFormat,
      sampleRate,
      microphone,
      onPartialTranscript: (data) => {
        transcriptsRef.current.partialTranscript = data.text;
        onChange?.(buildData(transcriptsRef.current));
      },
      onCommittedTranscript: (data) => {
        transcriptsRef.current.committedTranscripts.push(data.text);
        transcriptsRef.current.partialTranscript = "";
        onChange?.(buildData(transcriptsRef.current));
      },
      onError,
      onAuthError,
      onQuotaExceededError,
    });

    const scribeRef = React.useRef(scribe);
    scribeRef.current = scribe;

    const isConnecting = isTokenPending || scribe.status === "connecting";

    const start = React.useCallback(async () => {
      const requestId = startRequestIdRef.current + 1;
      startRequestIdRef.current = requestId;

      transcriptsRef.current = {
        partialTranscript: "",
        committedTranscripts: [],
      };
      scribeRef.current.clearTranscripts();
      setIsTokenPending(true);

      try {
        const token = await getToken();
        if (startRequestIdRef.current !== requestId) {
          return;
        }

        await scribeRef.current.connect({
          token,
        });
        if (startRequestIdRef.current !== requestId) {
          scribeRef.current.disconnect({ skipCommit: true });
          return;
        }
        onStart?.(buildData(transcriptsRef.current));
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      } finally {
        if (startRequestIdRef.current === requestId) {
          setIsTokenPending(false);
        }
      }
    }, [getToken, onStart, onError]);

    const stop = React.useCallback(() => {
      startRequestIdRef.current += 1;
      setIsTokenPending(false);

      const data = buildData({
        partialTranscript: scribeRef.current.partialTranscript,
        committedTranscripts: scribeRef.current.committedTranscripts.map(
          (t) => t.text
        ),
      });
      transcriptsRef.current = {
        partialTranscript: data.partialTranscript,
        committedTranscripts: data.committedTranscripts,
      };
      onChange?.(data);

      scribeRef.current.disconnect();
      onStop?.(data);
    }, [onChange, onStop]);

    const cancel = React.useCallback(() => {
      startRequestIdRef.current += 1;
      setIsTokenPending(false);
      const data = buildData(transcriptsRef.current);
      scribeRef.current.disconnect({ skipCommit: true });
      scribeRef.current.clearTranscripts();
      transcriptsRef.current = {
        partialTranscript: "",
        committedTranscripts: [],
      };
      onCancel?.(data);
    }, [onCancel]);

    const contextValue: SpeechInputContextValue = React.useMemo(
      () => ({
        isConnected: scribe.isConnected,
        isConnecting,
        start,
        stop,
        cancel,
        error: scribe.error,
        size,
        ...buildData({
          partialTranscript: scribe.partialTranscript,
          committedTranscripts: scribe.committedTranscripts.map((t) => t.text),
        }),
      }),
      [
        scribe.isConnected,
        scribe.error,
        scribe.partialTranscript,
        scribe.committedTranscripts,
        isConnecting,
        start,
        stop,
        cancel,
        size,
      ]
    );

    React.useEffect(() => {
      return () => {
        startRequestIdRef.current += 1;
        setIsTokenPending(false);
        scribeRef.current.disconnect();
      };
    }, []);

    const reduceMotion = useReducedMotion();
    const showBarBackground = useBarBackgroundVisible(
      scribe.isConnected,
      reduceMotion
    );

    return (
      <SpeechInputContext.Provider value={contextValue}>
        <motion.div
          ref={ref}
          layout
          initial={false}
          transition={{
            layout: speechTransition(reduceMotion),
          }}
          className={cn(
            "relative inline-flex items-center justify-end overflow-hidden rounded-full",
            showBarBackground ? "bg-background dark:bg-accent/50" : "",
            className
          )}
        >
          {children}
        </motion.div>
      </SpeechInputContext.Provider>
    );
  }
);

SpeechInput.displayName = "SpeechInput";

export type SpeechInputRecordButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "size"
>;

/**
 * Stop button shown on the left while recording.
 */
const SpeechInputRecordButton = React.forwardRef<
  HTMLButtonElement,
  SpeechInputRecordButtonProps
>(function SpeechInputRecordButton(
  { className, onClick, variant = "ghost", disabled, ...props },
  ref
) {
  const speechInput = useSpeechInput();
  const reduceMotion = useReducedMotion();
  const buttonWidth = BUTTON_PX[speechInput.size ?? "default"];

  return (
    <AnimatePresence initial={false}>
      {speechInput.isConnected && (
        <motion.div
          key="speech-stop"
          layout
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: buttonWidth,
            opacity: 1,
            transition: barEnterTransition(
              reduceMotion,
              reduceMotion ? 0 : BAR_STAGGER
            ),
          }}
          exit={{
            width: 0,
            opacity: 0,
            transition: barExitTransition(reduceMotion),
          }}
          className="shrink-0 overflow-hidden"
        >
          <motion.div
            animate={{ scale: 0.9 }}
            whileTap={{ scale: 0.8 }}
            transition={speechTransition(reduceMotion, 0.18)}
          >
            <Button
              ref={ref}
              type="button"
              variant={variant}
              onClick={(e) => {
                speechInput.stop();
                onClick?.(e);
              }}
              disabled={disabled}
              className={cn(
                buttonVariants({ size: speechInput.size }),
                "relative flex items-center justify-center",
                className
              )}
              aria-label="Stop recording"
              {...props}
            >
              <HugeiconsIcon
                icon={StopIcon}
                strokeWidth={2}
                className="text-destructive h-4 w-4 fill-current"
              />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SpeechInputRecordButton.displayName = "SpeechInputRecordButton";

export interface SpeechInputPreviewProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Text to show when no transcript is available
   * @default "Listening..."
   */
  placeholder?: string;
}

/**
 * Displays the current transcript with a placeholder when empty.
 * Only visible when actively recording.
 */
const SpeechInputPreview = React.forwardRef<
  HTMLDivElement,
  SpeechInputPreviewProps
>(function SpeechInputPreview(
  { className, placeholder = "Listening..." },
  ref
) {
  const speechInput = useSpeechInput();
  const reduceMotion = useReducedMotion();

  const displayText = speechInput.transcript || placeholder;
  const showPlaceholder = !speechInput.transcript.trim();

  return (
    <AnimatePresence initial={false}>
      {speechInput.isConnected && (
        <motion.div
          ref={ref}
          key="speech-preview"
          layout
          style={{ transformOrigin: "right center" }}
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: PREVIEW_WIDTH,
            opacity: 1,
            transition: barEnterTransition(reduceMotion),
          }}
          exit={{
            width: 0,
            opacity: 0,
            transition: barExitTransition(
              reduceMotion,
              reduceMotion ? 0 : BAR_STAGGER
            ),
          }}
          className={cn(
            "relative shrink-0 self-stretch overflow-hidden text-sm",
            showPlaceholder
              ? "text-muted-foreground italic"
              : "text-muted-foreground",
            className
          )}
          title={displayText}
        >
          <div className="absolute inset-y-0 -right-1 -left-1 mask-[linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)]">
            <motion.p
              key="text"
              layout="position"
              transition={{ layout: speechTransition(reduceMotion, 0.18) }}
              className="absolute top-0 right-0 bottom-0 flex h-full min-w-full items-center px-1 whitespace-nowrap"
            >
              {displayText}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SpeechInputPreview.displayName = "SpeechInputPreview";

export type SpeechInputCancelButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "size"
>;

/**
 * Trailing control anchored on the right: mic to start, cancel to discard.
 * After the bar collapses, cancel crossfades into the mic in this slot.
 */
const SpeechInputCancelButton = React.forwardRef<
  HTMLButtonElement,
  SpeechInputCancelButtonProps
>(function SpeechInputCancelButton(
  { className, onClick, variant = "ghost", disabled, ...props },
  ref
) {
  const speechInput = useSpeechInput();
  const reduceMotion = useReducedMotion();
  const buttonWidth = BUTTON_PX[speechInput.size ?? "default"];
  const trailingMode = useTrailingSlotMode(
    speechInput.isConnected,
    speechInput.isConnecting,
    reduceMotion
  );

  return (
    <motion.div
      layout
      className="inline-flex shrink-0"
      style={{ width: buttonWidth }}
      transition={{ layout: speechTransition(reduceMotion) }}
    >
      <motion.div
        animate={{ scale: trailingMode === "cancel" ? 0.9 : 1 }}
        whileTap={{
          scale: trailingMode === "cancel" ? 0.8 : 0.97,
        }}
        transition={speechTransition(reduceMotion, 0.18)}
      >
        <Button
          ref={ref}
          type="button"
          variant={variant}
          onClick={(e) => {
            if (trailingMode === "mic") {
              void speechInput.start();
            } else if (trailingMode === "cancel") {
              speechInput.cancel();
            }
            onClick?.(e);
          }}
          disabled={
            disabled ??
            (trailingMode === "connecting" || speechInput.isConnecting)
          }
          className={cn(
            buttonVariants({ size: speechInput.size }),
            "relative flex items-center justify-center",
            className
          )}
          aria-label={
            trailingMode === "cancel"
              ? "Cancel recording"
              : trailingMode === "connecting"
                ? "Connecting"
                : "Start recording"
          }
          {...props}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {trailingMode === "connecting" ? (
                <motion.span
                  key="connecting"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 0.9 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={speechTransition(reduceMotion, 0.15)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Skeleton className="bg-primary h-4 w-4 rounded-full" />
                </motion.span>
              ) : trailingMode === "cancel" ? (
                <motion.span
                  key="cancel"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={speechTransition(reduceMotion, 0.15)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="h-3 w-3"
                  />
                </motion.span>
              ) : (
                <motion.span
                  key="mic"
                  {...micIconMotion(reduceMotion)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <HugeiconsIcon
                    icon={Mic02Icon}
                    strokeWidth={2}
                    className="h-4 w-4"
                  />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </Button>
      </motion.div>
    </motion.div>
  );
});

SpeechInputCancelButton.displayName = "SpeechInputCancelButton";

export {
  SpeechInput,
  SpeechInputRecordButton,
  SpeechInputPreview,
  SpeechInputCancelButton,
  useSpeechInput,
};
