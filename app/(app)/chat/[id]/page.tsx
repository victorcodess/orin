import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChatView } from "@/components/orin/chat-view";
import { ChatLoading } from "@/components/orin/chat-loading";
import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { verifyConversationAccess } from "@/lib/ai/conversations";
import { loadHistory, toUIMessages } from "@/lib/ai/messages";
import { debugLog } from "@/lib/debug";
import { createClient } from "@/lib/supabase/server";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

async function ChatPageContent({ params }: ChatPageProps) {
  await connection();
  const { id } = await params;

  try {
    await verifyConversationAccess(id);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const [assistant, history] = await Promise.all([
    getAssistantConfig(authData.user?.id),
    loadHistory(id),
  ]);

  debugLog("chat-page", "loaded conversation", {
    conversationId: id,
    historyCount: history.length,
    authUserId: authData.user?.id ?? null,
  });

  return (
    <ChatView
      conversationId={id}
      assistant={assistant}
      initialMessages={toUIMessages(history)}
    />
  );
}

export default function ChatPage(props: ChatPageProps) {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPageContent {...props} />
    </Suspense>
  );
}
