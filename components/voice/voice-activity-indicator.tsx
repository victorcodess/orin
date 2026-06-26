"use client";

import type { VoiceActivity } from "@/components/voice/use-voice-orb";
import { cn } from "@/lib/utils";

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

export function VoiceActivityIndicator({
  activity,
  className,
}: {
  activity: VoiceActivity;
  className?: string;
}) {
  const styles = activityStyles[activity];
  const pulse = activity === "listening" || activity === "talking";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        styles.ringClass,
        className
      )}
      aria-live="polite"
    >
      <span className="relative flex size-2">
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-60",
              styles.dotClass
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            styles.dotClass
          )}
        />
      </span>
      <span className="text-foreground">{styles.label}</span>
    </div>
  );
}
