import { Suspense } from "react";

import { AppHeader } from "@/components/orin/app-header";
import { AppSidebarShell } from "@/components/orin/app-sidebar-shell";
import { AppSidebarSkeleton } from "@/components/orin/app-sidebar-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarShell />
      </Suspense>
      <SidebarInset className="bg-background flex max-h-svh flex-col overflow-hidden">
        <Suspense
          fallback={
            <header className="flex h-14 shrink-0 items-center gap-2 px-4" />
          }
        >
          <AppHeader />
        </Suspense>
        <div className="flex h-full max-h-[calc(100vh-64px)] flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
