import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function requireAuthedUser(): Promise<{
  supabase: SupabaseClient;
  user: User;
} | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  return { supabase, user: data.user };
}
