import { connection } from "next/server";

import { AppSidebar } from "@/components/app-sidebar";
import { createClient } from "@/lib/supabase/server";

export async function AppSidebarShell() {
  await connection();

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  const authUser = authData.user;
  const sidebarUser = authUser
    ? {
        name:
          (authUser.user_metadata?.full_name as string | undefined) ??
          authUser.email?.split("@")[0] ??
          "User",
        email: authUser.email ?? "",
        avatar: (authUser.user_metadata?.avatar_url as string | undefined) ?? "",
      }
    : null;

  return <AppSidebar user={sidebarUser} />;
}
