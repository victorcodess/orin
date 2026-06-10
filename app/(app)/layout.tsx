import { connection } from "next/server";
import { Suspense } from "react";

import { AppHeader } from "@/components/orin/app-header";
import { AppSidebarShell } from "@/components/orin/app-sidebar-shell";
import { AppSidebarSkeleton } from "@/components/orin/app-sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarShell />
      </Suspense>
      <SidebarInset className="bg-background flex max-h-svh flex-col overflow-hidden">
        <AppHeader isLoggedIn={Boolean(data.user)} />
        <div className="flex h-full max-h-[calc(100vh-64px)] flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
