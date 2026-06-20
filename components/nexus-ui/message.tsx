"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Streamdown } from "streamdown";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CodeBlock } from "@/components/nexus-ui/codeblock";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { useMessageStyleStore } from "@/lib/stores/message-style-store";
import { cn } from "@/lib/utils";

const streamdownPlugins = { cjk, code, math, mermaid } as const;

const messageMarkdownProseClasses = [
  "prose max-w-none font-[450] text-[15px] leading-6.75 tracking-[-0.1px]",
  // headings
  "prose-headings:font-[450] prose-headings:leading-5.5 prose-h2:tracking-[-0.45px] prose-headings:mb-4 prose-headings:mt-6 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-h3:leading-4.5 prose-h3:tracking-[-0.4px] prose-h4:text-sm prose-h5:text-xs prose-h6:text-xs",
  // heading links
  "prose-headings:[&_a]:no-underline prose-headings:[&_a]:shadow-none prose-headings:[&_a]:text-inherit",
  // body text
  "prose-p:mb-1 prose-p:mt-4",
  // lead
  "prose-lead:text-primary",
  // links
  "[&_[data-streamdown=link]]:text-foreground [&_[data-streamdown=link]]:font-normal [&_[data-streamdown=link]]:underline [&_[data-streamdown=link]]:underline-offset-2",
  // strong
  "[&_[data-streamdown=strong]]:text-foreground [&_[data-streamdown=strong]]:font-[550]",
  // lists
  "prose-li:my-[-0.5px] prose-li:marker:text-muted-foreground/50 prose-ul:my-0 prose-ol:my-0 prose-ol:pl-3",
] as const;

type MessageFrom = "user" | "assistant";

type MessageContextValue = {
  from: MessageFrom;
};

const MessageContext = React.createContext<MessageContextValue | null>(null);

function useMessageContext() {
  return React.useContext(MessageContext);
}

type MessageProps = React.HTMLAttributes<HTMLDivElement> & {
  from: MessageFrom;
};

const Message = React.forwardRef<HTMLDivElement, MessageProps>(function Message(
  {
    className,
    from,
    children,
    "aria-label": ariaLabelProp,
    "aria-labelledby": ariaLabelledBy,
    ...props
  },
  ref
) {
  const ariaLabel =
    ariaLabelProp ??
    (ariaLabelledBy == null
      ? from === "user"
        ? "User message"
        : "Assistant message"
      : undefined);

  return (
    <MessageContext.Provider value={{ from }}>
      <div
        ref={ref}
        data-slot="message"
        role="article"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "group/message flex w-full max-w-[98%] items-start gap-2 md:max-w-[90%]",
          from === "user" ? "ms-auto" : "me-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </MessageContext.Provider>
  );
});

type MessageStackProps = React.HTMLAttributes<HTMLDivElement>;

function MessageStack({ className, ...props }: MessageStackProps) {
  const ctx = useMessageContext();
  const from = ctx?.from ?? "assistant";

  return (
    <div
      data-slot="message-stack"
      className={cn(
        "flex w-full flex-col gap-2",
        from === "user" ? "items-end" : "items-start",
        className
      )}
      {...props}
    />
  );
}

type MessageContentProps = React.HTMLAttributes<HTMLDivElement>;

const sidebarBubbleClasses =
  "bg-sidebar dark:bg-input w-fit rounded-3xl px-4 py-1.75";
const sidebarBubbleTailFill = "fill-sidebar dark:fill-input";

function MessageBubbleTail({
  side,
  fillClass,
}: {
  side: "left" | "right";
  fillClass: string;
}) {
  return (
    <svg
      width="16"
      height="16"
      aria-hidden
      className={cn(
        "absolute top-[-5.5px] transition-[scale,fill,opacity] duration-300 will-change-[fill,opacity]",
        fillClass,
        side === "right" ? "right-0.5" : "left-0.5 scale-x-[-1]"
      )}
      fill="currentColor"
    >
      <path d="M-2.70729e-07 6.19355C8 6.19355 12 4.12903 16 6.99382e-07C16 6.70968 16 13.5 10 16L-2.70729e-07 6.19355Z" />
    </svg>
  );
}

function MessageContent({
  className,
  children,
  ...props
}: MessageContentProps) {
  const ctx = useMessageContext();
  const from = ctx?.from ?? "assistant";
  const bothBubbles = useMessageStyleStore(
    (state) => state.layout === "both-bubbles"
  );

  const isUser = from === "user";

  return (
    <div
      data-slot="message-content"
      data-message-layout={bothBubbles ? "both-bubbles" : "single-bubble"}
      className={cn(
        "relative",
        isUser
          ? bothBubbles
            ? "bg-primary dark:bg-primary-dark text-popover dark:text-card-foreground w-fit rounded-3xl px-4 py-1.75"
            : sidebarBubbleClasses
          : bothBubbles
            ? cn(sidebarBubbleClasses, "max-w-full")
            : "mb-1 w-full bg-transparent px-2",
        className
      )}
      {...props}
    >
      {children}

      {isUser ? (
        <MessageBubbleTail
          side="right"
          fillClass={
            bothBubbles
              ? "fill-primary dark:fill-primary-dark"
              : sidebarBubbleTailFill
          }
        />
      ) : bothBubbles ? (
        <MessageBubbleTail side="left" fillClass={sidebarBubbleTailFill} />
      ) : null}
    </div>
  );
}

type MessageMarkdownProps = React.ComponentProps<typeof Streamdown>;

function MessageMarkdown({
  className,
  components,
  ...props
}: MessageMarkdownProps) {
  const mergedComponents = React.useMemo(() => {
    const defaultComponents = {
      code: CodeBlock,
      inlineCode: ({
        children,
        className,
        ...props
      }: React.HTMLAttributes<HTMLElement>) => (
        <code
          className={cn(
            "bg-muted rounded-md border-none px-1.5 py-0.5 font-mono text-xs font-[450]",
            className
          )}
          data-slot="message-markdown-inline-code"
          {...props}
        >
          {children}
        </code>
      ),
      table: (props: React.HTMLAttributes<HTMLTableElement>) => (
        <div
          data-slot="message-markdown-table-wrap"
          className={[
            "prose-no-margin border-border bg-muted dark:border-accent dark:bg-background my-6 overflow-hidden rounded-2xl border",
            "[&_tbody_tr:first-child_td:first-child]:rounded-ss-xl",
            "[&_tbody_tr:first-child_td:last-child]:rounded-se-xl",
            "[&_tbody_tr:last-child_td:first-child]:rounded-es-xl",
            "[&_tbody_tr:last-child_td:last-child]:rounded-ee-xl",
          ].join(" ")}
        >
          <table
            data-slot="message-markdown-table"
            className="bg-muted dark:bg-background w-full border-separate border-spacing-0 border-none text-sm"
            {...props}
          />
        </div>
      ),
      th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
        <th
          data-slot="message-markdown-th"
          className="text-muted-foreground! dark:bg-background border-none px-5 py-2 text-start text-[13px] font-normal!"
          {...props}
        />
      ),
      td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
        <td
          data-slot="message-markdown-td"
          className="border-accent bg-card text-primary dark:bg-card border-0 px-5 py-3 text-[13px] [tr:not(:first-child)_&]:border-t"
          {...props}
        />
      ),
    };

    return {
      ...(defaultComponents as object),
      ...((components ?? {}) as object),
    };
  }, [components]);

  return (
    <Streamdown
      data-slot="message-markdown"
      className={cn(
        ...messageMarkdownProseClasses,
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={mergedComponents as MessageMarkdownProps["components"]}
      shikiTheme={["github-light", "github-dark"]}
      plugins={streamdownPlugins}
      {...props}
    />
  );
}

type MessageActionsProps = React.HTMLAttributes<HTMLDivElement>;

function MessageActions({ className, ...props }: MessageActionsProps) {
  const ctx = useMessageContext();
  const from = ctx?.from ?? "assistant";

  return (
    <div
      data-slot="message-actions"
      className={cn(
        "flex w-full",
        from === "user" ? "justify-end" : "justify-start",
        className
      )}
      {...props}
    />
  );
}

type MessageActionGroupProps = React.HTMLAttributes<HTMLDivElement>;

function MessageActionGroup({ className, ...props }: MessageActionGroupProps) {
  return (
    <div
      data-slot="message-action-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

type MessageActionProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
  tooltip?:
    | string
    | {
        content?: string;
        side?: "top" | "right" | "bottom" | "left";
        shortcut?: string;
      };
};

function MessageAction({
  asChild = false,
  tooltip,
  ...props
}: MessageActionProps) {
  const Comp = asChild ? Slot : "div";
  const {
    content,
    side = "bottom",
    shortcut,
  } = typeof tooltip === "string" ? { content: tooltip } : (tooltip ?? {});

  if (!content) {
    return <Comp data-slot="message-action" {...props} />;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={700}>
        <TooltipTrigger asChild>
          <Comp data-slot="message-action" {...props} />
        </TooltipTrigger>
        <TooltipContent className="rounded-full" side={side} sideOffset={3}>
          {content}
          {shortcut ? <Kbd className="rounded-md!">{shortcut}</Kbd> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export type MessageAvatarProps = {
  src: string;
  alt?: string;
  fallback?: React.ReactNode;
  delayMs?: React.ComponentProps<typeof AvatarFallback>["delayMs"];
  size?: React.ComponentProps<typeof Avatar>["size"];
  className?: string;
};

function MessageAvatar({
  src,
  alt = "",
  fallback,
  delayMs,
  size,
  className,
}: MessageAvatarProps) {
  return (
    <Avatar
      data-slot="message-avatar"
      size={size}
      className={cn("size-7 shrink-0", className)}
    >
      <AvatarImage
        data-slot="message-avatar-image"
        src={src}
        alt={alt}
        className="my-0!"
      />
      <AvatarFallback
        data-slot="message-avatar-fallback"
        delayMs={delayMs}
        className="my-0! shrink-0"
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

export {
  Message,
  MessageStack,
  MessageContent,
  MessageMarkdown,
  MessageActions,
  MessageActionGroup,
  MessageAction,
  MessageAvatar,
};
