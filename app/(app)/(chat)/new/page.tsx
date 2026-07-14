import { NewChatView } from "@/components/chat/new-chat-view";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata = createPageMetadata({
  title: "New chat",
  description:
    "Start a conversation with Orin. Text when you want to think quietly, or call when speaking out loud feels better.",
  path: "/new",
});

export default function NewChatPage() {
  return <NewChatView />;
}
