"use client";

import { useEffect, useRef } from "react";

import type { AgentState } from "@/components/elevenlabs/orb";
import { cn } from "@/lib/utils";

type VoicePillProps = {
  state: AgentState;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  colors?: [string, string];
  className?: string;
};

/**
 * Lightweight audio-reactive gradient pill. Mirrors the orb's behaviour (it
 * brightens with the active speaker's volume and keeps a gentle shimmer while
 * idle) without the cost of a WebGL canvas.
 */
export function VoicePill({
  state,
  getInputVolume,
  getOutputVolume,
  colors = ["#f97015", "#fcf8f3"],
  className,
}: VoicePillProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let level = 0;
    let t = 0;

    const tick = () => {
      t += 0.016;
      let target: number;
      if (state === "talking") {
        target = clamp01(getOutputVolume?.() ?? 0);
      } else if (state === "listening") {
        target = clamp01(getInputVolume?.() ?? 0);
      } else {
        // Soft baseline shimmer between turns so the pill never looks dead.
        target = 0.12 + 0.06 * Math.sin(t * 1.6);
      }
      level += (target - level) * 0.18;

      const el = glowRef.current;
      if (el) {
        el.style.setProperty("--level", level.toFixed(3));
        el.style.backgroundPosition = `${(t * 22) % 200}% 50%`;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, getInputVolume, getOutputVolume]);

  const [from, to] = colors;

  return (
    <div
      className={cn(
        "bg-foreground/4 relative overflow-hidden rounded-full",
        className
      )}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 blur-[2px] will-change-[opacity]"
        style={{
          background: `linear-gradient(90deg, ${from}00, ${from}, ${to}, ${from}, ${from}00)`,
          backgroundSize: "200% 100%",
          opacity: "calc(0.25 + var(--level, 0) * 0.75)",
        }}
      />
    </div>
  );
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
