import { Suspense } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppHeader } from "@/components/shell/app-header";
import { AppKeyboardShortcuts } from "@/components/shell/app-keyboard-shortcuts";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <AppKeyboardShortcuts />
      <SidebarInset className="bg-background relative flex max-h-svh flex-col overflow-hidden">
        <Suspense
          fallback={
            <header className="flex h-14 shrink-0 items-center gap-2 px-4" />
          }
        >
          <div className="h-10 w-full"></div>
          <AppHeader />
        </Suspense>
        <div className="flex h-full max-h-[calc(100vh-0.5px)] flex-col lg:max-h-[calc(100vh-64px)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
