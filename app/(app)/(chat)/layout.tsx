import { ChatComposerDock } from "@/components/chat/chat-composer";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-chat-route className="relative flex h-full min-h-0 flex-1 flex-col">
      {children}
      <ChatComposerDock />
    </div>
  );
}
