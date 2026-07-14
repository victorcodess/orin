import { ChatPageClient } from "@/components/chat/chat-page-client";
import { createNoIndexMetadata } from "@/lib/seo/metadata";

export const metadata = createNoIndexMetadata();

type ChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export default function ChatPage(props: ChatPageProps) {
  return <ChatPageClient {...props} />;
}
