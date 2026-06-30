import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getAssistantConfig } from "@/lib/ai/assistant-config";
import {
  createConversation,
  getConversation,
  maybeUpdateConversationTitle,
  verifyConversationAccess,
} from "@/lib/ai/conversations";
import {
  deleteMessagesAfterUserMessage,
  saveMessage,
  saveMessageIfNew,
  textFromUIMessage,
  updateUserMessageAndDeleteAfter,
} from "@/lib/ai/messages";
import { sanitizeUIMessagesForModel } from "@/lib/ai/message-utils";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { debugError, debugLog } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { isQuotaBlockedError, quotaBlockedResponse } from "@/lib/quotas/errors";
import { resolveOpenAIKey } from "@/lib/quotas/resolve";
import { ensureSessionCookie } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  conversationId: string;
};

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, conversationId } = body;

    debugLog("api/chat", "request received", {
      conversationId,
      messageCount: messages?.length,
      roles: messages?.map((m) => m.role),
    });

    if (!conversationId || !messages?.length) {
      debugLog("api/chat", "validation failed", { conversationId, messages });
      return Response.json(
        { error: "conversationId and messages are required" },
        { status: 400 },
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    let conversation = await getConversation(conversationId);
    const quotaCtx = await getQuotaContext();

    if (!conversation) {
      if (!lastUserMessage) {
        return Response.json(
          { error: "conversationId and messages are required" },
          { status: 400 },
        );
      }

      if (!quotaCtx.userId) {
        await ensureSessionCookie();
        Object.assign(quotaCtx, await getQuotaContext());
      }

      await resolveOpenAIKey(quotaCtx, "new_conversation");

      conversation = await createConversation({
        id: conversationId,
        initialMessage: textFromUIMessage(lastUserMessage),
      });
    } else {
      conversation = await verifyConversationAccess(conversationId);
    }

    debugLog("api/chat", "access verified", {
      conversationId: conversation.id,
      userId: conversation.user_id,
      sessionId: conversation.session_id,
    });

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const config = await getAssistantConfig(authData.user?.id);

    debugLog("api/chat", "assistant config loaded", {
      authUserId: authData.user?.id ?? null,
    });

    if (lastUserMessage) {
      const userText = textFromUIMessage(lastUserMessage);
      debugLog("api/chat", "saving user message", {
        messageId: lastUserMessage.id,
        preview: userText.slice(0, 80),
      });

      const updatedExistingMessage = await updateUserMessageAndDeleteAfter({
        id: lastUserMessage.id,
        conversationId,
        content: userText,
        source: "text",
      });

      if (!updatedExistingMessage) {
        await resolveOpenAIKey(quotaCtx, "message_turn");

        await saveMessageIfNew({
          id: lastUserMessage.id,
          conversationId,
          role: "user",
          content: userText,
          source: "text",
        });
      }

      await maybeUpdateConversationTitle(conversationId, userText);
    }

    const openaiResolved = await resolveOpenAIKey(quotaCtx, "message_turn");
    const openai = createOpenAI({ apiKey: openaiResolved.key });

    const modelMessages = await convertToModelMessages(
      sanitizeUIMessagesForModel(messages),
    );

    if (modelMessages.length === 0) {
      return Response.json(
        { error: "At least one non-empty message is required" },
        { status: 400 },
      );
    }

    const system = buildPersonalityPrompt(config.personalitySettings);

    debugLog("api/chat", "starting streamText", {
      modelMessageCount: modelMessages.length,
      systemPromptChars: system.length,
      keySource: openaiResolved.source,
      elapsedMs: Date.now() - startedAt,
    });

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system,
      messages: modelMessages,
      onError: ({ error }) => {
        debugError("api/chat", "streamText failed", error);
      },
      onFinish: ({ text }) => {
        void (async () => {
          debugLog("api/chat", "stream finished", {
            textLength: text.length,
            elapsedMs: Date.now() - startedAt,
          });

          if (!text.trim()) {
            return;
          }

          if (lastUserMessage) {
            await deleteMessagesAfterUserMessage(
              conversationId,
              lastUserMessage.id,
            );
          }

          await saveMessage({
            conversationId,
            role: "assistant",
            content: text,
            source: "text",
          });

          debugLog("api/chat", "assistant message saved");
        })();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    debugError("api/chat", "request failed", error);

    if (isQuotaBlockedError(error)) {
      return quotaBlockedResponse(error);
    }

    const message = getErrorMessage(error);

    const status =
      message === "Forbidden"
        ? 403
        : message === "Conversation not found"
          ? 404
          : 500;

    return Response.json({ error: message }, { status });
  }
}
