import { ChatPageClient } from "@/components/chat/chat-page-client";

type ChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default function ChatPage(props: ChatPageProps) {
  return <ChatPageClient {...props} />;
}
