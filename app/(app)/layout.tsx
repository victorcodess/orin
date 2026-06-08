import { Suspense } from "react";

import { AppSidebarShell } from "@/components/orin/app-sidebar-shell";
import { AppSidebarSkeleton } from "@/components/orin/app-sidebar-skeleton";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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
      <SidebarInset className="flex max-h-svh flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="ml-auto">
            <ThemeSwitcher />
          </div>
        </header>
        <div className="flex h-full max-h-[calc(100vh-64px)] flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
