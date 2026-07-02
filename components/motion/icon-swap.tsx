"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

const ICON_SWAP_EASE = [0.25, 0.1, 0.25, 1] as const;

export function iconSwapTransition(
  reduceMotion: boolean | null,
  duration = 0.2
) {
  return reduceMotion ? { duration: 0 } : { duration, ease: ICON_SWAP_EASE };
}

export function iconSwapMotion(reduceMotion: boolean | null) {
  const blur = reduceMotion ? "blur(0px)" : "blur(1px)";

  return {
    initial: { opacity: 0, scale: 0.9, filter: blur },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.9,
      filter: blur,
      transition: iconSwapTransition(reduceMotion, 0.15),
    },
    transition: iconSwapTransition(reduceMotion, 0.2),
  } as const;
}

type IconSwapPresenceProps = {
  activeKey: string | null;
  reduceMotion: boolean | null;
  className?: string;
  icons: Record<string, ReactNode>;
};

export function IconSwapPresence({
  activeKey,
  reduceMotion,
  className = "absolute inset-0 flex items-center justify-center",
  icons,
}: IconSwapPresenceProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {activeKey ? (
        <motion.span
          key={activeKey}
          {...iconSwapMotion(reduceMotion)}
          className={className}
        >
          {icons[activeKey]}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
