import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const messageSkeletonWidth =
  "w-full max-w-[98%] md:max-w-[90%]" as const;

const assistantLineWidths = [
  "w-full",
  "w-11/12",
  "w-4/5",
  "w-2/3",
] as const;

function MessageActionsSkeleton({
  from,
  count,
}: {
  from: "user" | "assistant";
  count: number;
}) {
  return (
    <div
      className={cn(
        "flex w-full gap-1",
        from === "user" ? "justify-end" : "justify-start"
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className="bg-accent/60 dark:bg-muted/60 size-8 rounded-full"
          aria-hidden
        />
      ))}
    </div>
  );
}

function UserMessageSkeleton() {
  return (
    <div className={cn(messageSkeletonWidth, "ms-auto flex flex-col gap-2")}>
      <Skeleton
        className="bg-accent/60 dark:bg-muted/60 ms-auto h-10 w-2/3 rounded-3xl"
        aria-hidden
      />
      <MessageActionsSkeleton from="user" count={2} />
    </div>
  );
}

function AssistantMessageSkeleton({ lines }: { lines: number }) {
  return (
    <div
      className={cn(messageSkeletonWidth, "me-auto flex flex-col gap-2 mt-1.5")}
    >
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            className={cn(
              "bg-accent/60 dark:bg-muted/60 h-4 rounded-md",
              assistantLineWidths[index % assistantLineWidths.length]
            )}
            aria-hidden
          />
        ))}
      </div>
      <MessageActionsSkeleton from="assistant" count={3} />
    </div>
  );
}

export function ChatLoading() {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="h-(--orin-thread-height) min-h-0 overflow-hidden [--orin-thread-height:calc(100dvh-133px)] md:[--orin-thread-height:calc(100dvh-156px)]">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-6 px-6 pt-7.5 pb-30 md:pt-10 md:pb-60">
          <UserMessageSkeleton />
          <AssistantMessageSkeleton lines={2} />
          <UserMessageSkeleton />
          <AssistantMessageSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
