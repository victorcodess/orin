import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ChatLoading } from "@/components/orin/chat-loading";
import { createConversation } from "@/lib/ai/conversations";

async function NewChatRedirect(): Promise<React.ReactNode> {
  await connection();
  const conversation = await createConversation();
  redirect(`/chat/${conversation.id}`);
  return null;
}

export default function NewChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <NewChatRedirect />
    </Suspense>
  );
}
