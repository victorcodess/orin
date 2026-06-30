import Link from "next/link";

import { HomeContent } from "@/components/marketing/home-content";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

export default function Home() {
  return (
    <main className="bg-background relative flex h-full min-h-screen flex-col items-center justify-center overflow-hidden px-8">
      <HomeContent />

      <footer className="text-muted-foreground absolute bottom-6 md:bottom-8 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-4 sm:gap-2 text-sm font-[450]">
        <ThemeSwitcher className="md:absolute -bottom-1 right-8 mb-4 md:mb-0" />
        <div className="flex w-full items-center justify-center gap-4">
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
            href="/privacy"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            Privacy
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row w-full items-center justify-center gap-2 sm:gap-4">
          <span className="text-muted-foreground text-sm">
            © 2026 Orin. All rights reserved
          </span>
          <span className="hidden sm:block">•</span>
          <span>
            Built by{" "}
            <Link
              href="https://victorwilliams.me"
              target="_blank"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Victor Williams
            </Link>
          </span>
        </div>
      </footer>
    </main>
  );
}
