import Link from "next/link";

import {
  MARKETING_LEGAL_LINKS,
  MARKETING_SOCIAL_LINKS,
} from "@/components/marketing/marketing-links";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

export function HomeFooter() {
  return (
    <footer className="text-muted-foreground absolute bottom-6 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-4 text-sm font-[450] sm:gap-2 md:bottom-8">
      <ThemeSwitcher className="right-8 -bottom-3 mb-4 md:absolute md:mb-0" />
      <div className="flex w-full items-center justify-center gap-4 md:hidden flex-wrap">
        {MARKETING_SOCIAL_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            {label}
          </Link>
        ))}
        {MARKETING_LEGAL_LINKS.map(({ href, label, page }) => (
          <Link
            key={page}
            href={href}
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4">
        <span className="text-muted-foreground text-sm">
          © 2026 All rights reserved
        </span>
        <span className="hidden sm:block">•</span>
        <span>
          Built by
          <Link
            href="https://victorwilliams.me"
            target="_blank"
            rel="noreferrer"
            className="text-foreground hover:text-primary underline-offset-2 transition-colors hover:underline ml-1"
          >
            Victor Williams
          </Link>
        </span>
      </div>
    </footer>
  );
}
