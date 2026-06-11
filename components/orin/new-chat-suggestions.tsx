"use client";

import {
  ArrowRight01Icon,
  BookOpenTextIcon,
  Cancel01Icon,
  Message01Icon,
  SparklesIcon,
  StrategyIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useRef, useState } from "react";

import {
  Suggestion,
  SuggestionList,
  SuggestionPanel,
  SuggestionPanelClose,
  SuggestionPanelContent,
  SuggestionPanelHeader,
  SuggestionPanelTitle,
  Suggestions,
} from "@/components/nexus-ui/suggestions";
import { cn } from "@/lib/utils";

const EASE = [0.25, 0.1, 0.25, 1] as const;
const PANEL_EASE = [0.32, 0.72, 0, 1] as const;
const INSTANT = { duration: 0 } as const;

const MotionSuggestion = motion.create(Suggestion);
const MotionSuggestionList = motion.create(SuggestionList);
const MotionSuggestionPanel = motion.create(SuggestionPanel);
const MotionSuggestionPanelTitle = motion.create(SuggestionPanelTitle);
const MotionSuggestionPanelClose = motion.create(SuggestionPanelClose);

const SUGGESTION_CATEGORIES = [
  {
    label: "Vent",
    icon: Message01Icon,
    suggestions: [
      "Something's been weighing on me and I need to talk it out",
      "I had a rough day and just want to be heard",
      "There's a situation at work I can't stop thinking about",
      "I'm frustrated about something and don't want advice yet",
    ],
  },
  {
    label: "Celebrate",
    icon: SparklesIcon,
    suggestions: [
      "I got news today I'm really excited about",
      "A small win happened and I want to savor it",
      "Something I've been working toward finally paid off",
      "I want to mark a moment before it passes",
    ],
  },
  {
    label: "Decide",
    icon: StrategyIcon,
    suggestions: [
      "I'm torn between two options and need to think aloud",
      "Should I have the conversation I've been putting off?",
      "A job offer landed and I'm not sure what to do",
      "What's actually worth my energy right now?",
    ],
  },
  {
    label: "Reflect",
    icon: BookOpenTextIcon,
    suggestions: [
      "What stands out when I look back on this week?",
      "I've noticed a pattern in how I've been feeling",
      "What am I grateful for that I keep overlooking?",
      "What intention do I want to carry into next week?",
    ],
  },
] as const;

type NewChatSuggestionsProps = {
  onSelect: (value: string) => void;
  placement: "top" | "bottom";
};

export function NewChatSuggestions({
  onSelect,
  placement,
}: NewChatSuggestionsProps) {
  const isTop = placement === "top";
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = SUGGESTION_CATEGORIES.find((c) => c.label === activeCategory);

  const handleCategoryClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, category: string) => {
      triggerRef.current = event.currentTarget;
      if (activeCategory === category && open) {
        setOpen(false);
        return;
      }
      setActiveCategory(category);
      setOpen(true);
    },
    [activeCategory, open]
  );

  const handleClose = useCallback(() => {
    triggerRef.current?.focus();
    setActiveCategory(null);
  }, []);

  const handleSuggestionSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setOpen(false);
    },
    [onSelect]
  );

  const pillOffset = isTop ? -8 : 8;
  const panelOffset = isTop ? 12 : -12;

  return (
    <div className="relative w-full">
      <Suggestions className="w-full">
        <MotionSuggestionList
          orientation={isTop ? "vertical" : "horizontal"}
          className={cn("justify-center", isTop && "gap-1.5")}
          variants={{
            show: {
              transition: reduceMotion
                ? { duration: 0 }
                : { staggerChildren: 0.04, delayChildren: 0.03 },
            },
            panelOpen: {
              transition: INSTANT,
            },
          }}
          initial="hidden"
          animate={open ? "panelOpen" : "show"}
        >
          {SUGGESTION_CATEGORIES.map((category) => (
            <MotionSuggestion
              key={category.label}
              variants={{
                hidden: { opacity: 0, y: reduceMotion ? 0 : 6 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduceMotion ? 0 : 0.22, ease: EASE },
                },
                panelOpen: {
                  opacity: 0,
                  y: reduceMotion ? 0 : pillOffset,
                  scale: reduceMotion ? 1 : 0.97,
                  transition: INSTANT,
                },
              }}
              variant={isTop ? "ghost" : "outline"}
              onClick={(event) => handleCategoryClick(event, category.label)}
              className={cn(
                "text-foreground/90 hover:text-foreground/90 h-9 px-4! font-medium",
                open && "pointer-events-none",
                isTop && "h-10 gap-2.5 text-[15px]"
              )}
            >
              <HugeiconsIcon
                icon={category.icon}
                strokeWidth={2}
                className={cn("size-3.5", isTop && "size-4")}
              />
              {category.label}
            </MotionSuggestion>
          ))}
        </MotionSuggestionList>
      </Suggestions>

      <AnimatePresence onExitComplete={handleClose}>
        {open && active ? (
          <MotionSuggestionPanel
            key={active.label}
            animation="motion"
            open
            onOpenChange={setOpen}
            initial={{
              opacity: 0,
              y: reduceMotion ? 0 : panelOffset,
              scale: reduceMotion ? 1 : 0.98,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: INSTANT }}
            transition={{
              duration: reduceMotion ? 0 : 0.26,
              ease: PANEL_EASE,
            }}
            className={cn(
              "gap-3 bg-transparent px-1",
              isTop
                ? "top-auto -bottom-3 w-full rounded-t-2xl rounded-b-none"
                : "-top-5 mt-1"
            )}
          >
            {isTop ? (
              <SuggestionPanelHeader className="h-6 px-4">
                <MotionSuggestionPanelTitle
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.2,
                    delay: reduceMotion ? 0 : 0.05,
                    ease: EASE,
                  }}
                >
                  <HugeiconsIcon
                    icon={active.icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  <span className="text-[13px] font-[450]">{active.label}</span>
                </MotionSuggestionPanelTitle>
                <MotionSuggestionPanelClose
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.18,
                    delay: reduceMotion ? 0 : 0.08,
                    ease: EASE,
                  }}
                  whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                  className="hover:text-foreground dark:hover:text-foreground -mr-0.75 size-5"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                </MotionSuggestionPanelClose>
              </SuggestionPanelHeader>
            ) : null}
            <SuggestionPanelContent>
              <Suggestions onSelect={handleSuggestionSelect} className="gap-0">
                <MotionSuggestionList
                  orientation="vertical"
                  className="[&>*+*]:before:bg-border/20 w-full gap-0 [&>*+*]:relative [&>*+*]:before:pointer-events-none [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:top-0 [&>*+*]:before:z-10 [&>*+*]:before:h-px [&>*+*]:before:content-['']"
                  variants={{
                    show: {
                      transition: reduceMotion
                        ? { duration: 0 }
                        : { staggerChildren: 0.04, delayChildren: 0.06 },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {active.suggestions.map((text) => (
                    <MotionSuggestion
                      key={text}
                      variants={{
                        hidden: { opacity: 0, y: reduceMotion ? 0 : 6 },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: reduceMotion ? 0 : 0.2,
                            ease: EASE,
                          },
                        },
                      }}
                      variant="ghost"
                      value={text}
                      className={cn(
                        "group hover:text-foreground text-foreground/80 hover:bg-muted hover:dark:bg-muted-foreground/40 min-h-11 w-full justify-between px-4! text-left font-[450] whitespace-normal",
                        isTop && "text-[15px]"
                      )}
                    >
                      {text}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="text-muted-foreground size-4 opacity-0 group-hover:opacity-100"
                      />
                    </MotionSuggestion>
                  ))}
                </MotionSuggestionList>
              </Suggestions>
            </SuggestionPanelContent>
          </MotionSuggestionPanel>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
