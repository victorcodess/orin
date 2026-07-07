import Link from "next/link";

import {
  MARKETING_LEGAL_LINKS,
  MARKETING_SOCIAL_LINKS,
  type MarketingLegalPage,
} from "@/components/marketing/marketing-links";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { cn } from "@/lib/utils";

type LegalFooterProps = {
  activePage: MarketingLegalPage;
};

export function LegalFooter({ activePage }: LegalFooterProps) {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-14 pb-12 md:px-8 md:pb-14 lg:px-10">
      <div className="border-border/50 mb-8 border-t" />

      <nav
        aria-label="Footer"
        className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-[450]"
      >
        <Link
          href="/"
          className="hover:text-primary underline-offset-2 transition-colors hover:underline"
        >
          Home
        </Link>
        {MARKETING_LEGAL_LINKS.map(({ href, label, page }) => (
          <Link
            key={page}
            href={href}
            aria-current={activePage === page ? "page" : undefined}
            className={cn(
              "underline-offset-2 transition-colors hover:underline",
              activePage === page ? "text-foreground" : "hover:text-primary",
            )}
          >
            {label}
          </Link>
        ))}
        {MARKETING_SOCIAL_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary underline-offset-2 transition-colors hover:underline"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 flex flex-col items-center gap-6">
        <ThemeSwitcher className="shrink-0" />
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 text-sm font-[450] sm:flex-row sm:gap-4">
          <span>© 2026 Victor Williams. All rights reserved</span>
          <span className="hidden sm:block">•</span>
          <span>
            Built by{" "}
            <Link
              href="https://victorwilliams.me"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground/80 hover:text-primary underline-offset-2 transition-colors hover:underline"
            >
              Victor Williams
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
