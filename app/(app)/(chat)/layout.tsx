import { Suspense } from "react";

import { ChatLoading } from "@/components/chat/chat-loading";
import { ChatComposerDockGate } from "@/components/chat/chat-shell";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      data-chat-route
      className="relative flex h-full min-h-0 flex-1 flex-col"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<ChatLoading />}>{children}</Suspense>
      </div>
      <Suspense fallback={null}>
        <ChatComposerDockGate />
      </Suspense>
    </div>
  );
}
