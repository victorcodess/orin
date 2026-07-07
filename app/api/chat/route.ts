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
import { TEXT_CHAT_MODEL } from "@/lib/ai/model";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { getPromptUserName } from "@/lib/orin/personality/runtime-context";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { isQuotaBlockedError, quotaBlockedResponse } from "@/lib/quotas/errors";
import { resolveOpenAIKey } from "@/lib/quotas/resolve";
import { ensureSessionCookie } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  conversationId: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, conversationId } = body;

    if (!conversationId || !messages?.length) {
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

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    const [config, userName] = await Promise.all([
      getAssistantConfig(authData.user?.id),
      authData.user
        ? getPromptUserName(authData.user.id, authData.user)
        : Promise.resolve(null),
    ]);

    const timeZone = req.headers.get("X-User-Timezone") ?? undefined;

    if (lastUserMessage) {
      const userText = textFromUIMessage(lastUserMessage);

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

    const system = buildPersonalityPrompt(config.personalitySettings, "text", {
      userName,
      timeZone,
    });

    const result = streamText({
      model: openai(TEXT_CHAT_MODEL),
      system,
      messages: modelMessages,
      onFinish: ({ text }) => {
        void (async () => {
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
        })();
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {

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
