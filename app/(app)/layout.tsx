import { Suspense } from "react";

import { AppSidebarShell } from "@/components/orin/app-sidebar-shell";
import { AppSidebarSkeleton } from "@/components/orin/app-sidebar-skeleton";
// import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<AppSidebarSkeleton />}>
        <AppSidebarShell />
      </Suspense>
      <SidebarInset className="bg-background flex max-h-svh flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger placement="inset" className="-ml-1" />
         
        </header>
        <div className="flex h-full max-h-[calc(100vh-64px)] flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
