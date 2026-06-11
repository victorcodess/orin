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

export function NewChatSuggestions({
  onSelect,
  placement,
}: {
  onSelect: (value: string) => void;
  placement: "top" | "bottom";
}) {
  const isTop = placement === "top";
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const active = SUGGESTION_CATEGORIES.find((c) => c.label === activeCategory);

  const handleCategoryClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, category: string) => {
      triggerRef.current = event.currentTarget;
      const isClosing = activeCategory === category;
      setActiveCategory(isClosing ? null : category);
      setOpen(!isClosing);
    },
    [activeCategory]
  );

  const handleClose = useCallback(() => {
    triggerRef.current?.focus();
    setActiveCategory(null);
  }, []);

  const handleSuggestionSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setOpen(false);
      setActiveCategory(null);
    },
    [onSelect]
  );

  return (
    <div className="relative w-full">
      <Suggestions className="w-full">
        <SuggestionList
          className={cn(
            "justify-center",
            isTop ? "flex-col items-start gap-1.5" : ""
          )}
        >
          {SUGGESTION_CATEGORIES.map((category) => (
            <Suggestion
              key={category.label}
              variant={isTop ? "ghost" : "outline"}
              onClick={(event) => handleCategoryClick(event, category.label)}
              className={cn(
                "text-foreground/90 hover:text-foreground/90 h-9 px-4! font-medium",
                open && "opacity-0",
                isTop ? "h-10 gap-2.5 text-[15px]" : ""
              )}
            >
              <HugeiconsIcon
                icon={category.icon}
                strokeWidth={2}
                className={cn("size-3.5", isTop ? "size-4" : "")}
              />
              {category.label}
            </Suggestion>
          ))}
        </SuggestionList>
      </Suggestions>

      <SuggestionPanel
        open={open}
        onOpenChange={setOpen}
        onClose={handleClose}
        className={cn(
          "mt-1 bg-transparent px-1",
          isTop
            ? "data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-top-0 top-auto -bottom-3 w-full rounded-t-2xl rounded-b-none"
            : ""
        )}
      >
        {active ? (
          <>
            {isTop && (
              <SuggestionPanelHeader className="h-6 px-4">
                <SuggestionPanelTitle className="text-muted-foreground">
                  <HugeiconsIcon
                    icon={active.icon}
                    strokeWidth={2}
                    className="size-3.5"
                  />
                  <span className="text-[13px] font-[450]">{active.label}</span>
                </SuggestionPanelTitle>
                <SuggestionPanelClose className="hover:text-foreground dark:hover:text-foreground -mr-0.75 size-5">
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2.0}
                    className="size-4"
                  />
                </SuggestionPanelClose>
              </SuggestionPanelHeader>
            )}
            <SuggestionPanelContent>
              <Suggestions onSelect={handleSuggestionSelect} className="gap-0">
                <SuggestionList
                  orientation="vertical"
                  className="[&>*+*]:before:bg-border/20 w-full gap-0 [&>*+*]:relative [&>*+*]:before:pointer-events-none [&>*+*]:before:absolute [&>*+*]:before:inset-x-0 [&>*+*]:before:top-0 [&>*+*]:before:z-10 [&>*+*]:before:h-px [&>*+*]:before:content-['']"
                >
                  {active.suggestions.map((text) => (
                    <Suggestion
                      key={text}
                      variant="ghost"
                      value={text}
                      className={cn(
                        "group hover:text-foreground text-foreground/80 hover:bg-muted hover:dark:bg-muted-foreground/40 min-h-11 w-full justify-between px-4! text-left font-[450] whitespace-normal",
                        isTop ? "text-[15px]" : ""
                      )}
                    >
                      {text}
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        strokeWidth={2}
                        className="text-muted-foreground size-4 opacity-0 transition-none group-hover:opacity-100"
                      />
                    </Suggestion>
                  ))}
                </SuggestionList>
              </Suggestions>
            </SuggestionPanelContent>
          </>
        ) : null}
      </SuggestionPanel>
    </div>
  );
}
