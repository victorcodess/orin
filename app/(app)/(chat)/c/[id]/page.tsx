import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChatView } from "@/components/chat/chat-view";
import { ChatLoading } from "@/components/chat/chat-loading";
import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { verifyConversationAccess } from "@/lib/ai/conversations";
import { loadHistory, toUIMessages } from "@/lib/ai/messages";
import { debugLog } from "@/lib/debug";
import { createClient } from "@/lib/supabase/server";

type ChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
};

async function ChatPageContent({ params, searchParams }: ChatPageProps) {
  await connection();
  const [{ id }, { message }] = await Promise.all([params, searchParams]);
  const initialPrompt = message?.trim() || undefined;

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
      initialPrompt={initialPrompt}
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
