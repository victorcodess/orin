import { Suspense } from "react";

import { ChatComposerDock } from "@/components/chat/chat-composer";
import { ChatLoading } from "@/components/chat/chat-loading";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-chat-route className="relative flex h-full min-h-0 flex-1 flex-col">
      <Suspense fallback={<ChatLoading />}>{children}</Suspense>
      <ChatComposerDock />
    </div>
  );
}
