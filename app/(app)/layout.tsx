import { Suspense } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/orin/app-header";
import { AppKeyboardShortcuts } from "@/components/orin/app-keyboard-shortcuts";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppKeyboardShortcuts />
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
