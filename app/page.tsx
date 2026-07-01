import Link from "next/link";

import { HomeContent } from "@/components/marketing/home-content";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { HomeNav } from "@/components/marketing/home-nav";

export default function Home() {
  return (
    <main data-home-route className="bg-sidebar ic flex h-dvh flex-col justify-end p-0 pt-0 sm:p-3 sm:pt-0">
      <HomeNav />
      <div className="bg-background dark:shadow-sidebar-border/5 shadow-sidebar-foreground/5 relative flex h-[calc(100%-44px)] w-full flex-col items-center justify-center overflow-hidden rounded-b-none rounded-t-4xl sm:rounded-4xl px-8 shadow-xl">
        <HomeContent />

        <footer className="text-muted-foreground absolute bottom-6 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-4 text-sm font-[450] sm:gap-2 md:bottom-8">
          <ThemeSwitcher className="right-8 -bottom-3 mb-4 md:absolute md:mb-0" />
          <div className="flex w-full items-center justify-center gap-4 md:hidden">
            <Link
              href="https://x.com/orin__chat"
              target="_blank"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="https://github.com/victorcodess/orin"
              target="_blank"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Terms of Service  
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
            <span className="text-muted-foreground text-sm">
              © 2026 Orin. All rights reserved
            </span>
            <span className="hidden sm:block">•</span>
            <span>
              Built by{" "}
              <Link
                href="https://victorwilliams.me"
                target="_blank"
                className="hover:text-primary hover:underline underline-offset-2 transition-colors text-muted-foreground/80"
              >
                Victor Williams
              </Link>
            </span>
            
          </div>
        </footer>
      </div>
    </main>
  );
}
