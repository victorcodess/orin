import "server-only";

import { loadHistory } from "@/lib/ai/messages";
import { createAdminClient } from "@/lib/supabase/admin";

export async function exportUserAccountData(
  userId: string,
  email: string,
) {
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "display_name, theme, language, message_bubble_layout, onboarding_completed, created_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const { data: conversations, error: conversationsError } = await admin
    .from("conversations")
    .select("id, title, is_favorited, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (conversationsError) {
    throw conversationsError;
  }

  const conversationsWithMessages = await Promise.all(
    (conversations ?? []).map(async (conversation) => ({
      ...conversation,
      messages: await loadHistory(conversation.id),
    })),
  );

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: userId,
      email,
      displayName: profile?.display_name ?? null,
    },
    preferences: profile
      ? {
          theme: profile.theme,
          language: profile.language,
          messageBubbleLayout: profile.message_bubble_layout,
          onboardingCompleted: profile.onboarding_completed,
        }
      : null,
    conversations: conversationsWithMessages,
  };
}

export async function deleteAllUserConversations(userId: string): Promise<number> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("conversations")
    .delete()
    .eq("user_id", userId)
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }
}
