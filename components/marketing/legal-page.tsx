import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";

import { LegalArticle } from "@/components/marketing/legal-article";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const LEGAL_LAST_UPDATED = "July 1, 2026";

type LegalPageProps = {
  title: string;
  description: string;
  lastUpdated?: string;
  activePage: "terms" | "privacy";
  children: React.ReactNode;
};

const PAGE_LINKS = [
  {
    href: "/terms",
    label: "Terms of Service",
    shortLabel: "Terms",
    page: "terms" as const,
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    shortLabel: "Privacy",
    page: "privacy" as const,
  },
] as const;

const EXTERNAL_LINKS = [
  { href: "https://github.com/victorcodess/orin", label: "GitHub" },
  { href: "https://x.com/orin__chat", label: "Twitter" },
] as const;

function LegalPageBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />

      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,color-mix(in_oklab,#f97015_22%,transparent),transparent_58%)] dark:bg-[radial-gradient(120%_80%_at_50%_-10%,color-mix(in_oklab,#f97015_16%,transparent),transparent_62%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_15%,color-mix(in_oklab,#f97015_12%,transparent),transparent_55%)] dark:bg-[radial-gradient(90%_70%_at_100%_15%,color-mix(in_oklab,#f97015_10%,transparent),transparent_50%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_0%_85%,color-mix(in_oklab,var(--secondary)_70%,transparent),transparent_60%)] dark:bg-[radial-gradient(80%_60%_at_0%_100%,color-mix(in_oklab,#f97015_8%,transparent),transparent_55%)]" />

      <div className="bg-primary/10 absolute -top-32 left-1/2 size-160 -translate-x-1/2 rounded-full blur-[100px] dark:bg-primary/14 dark:blur-[120px]" />

      <div className="bg-primary/6 absolute top-[38%] -right-28 size-96 rounded-full blur-[88px] dark:bg-primary/10" />

      <div className="bg-secondary/50 absolute -bottom-24 -left-20 size-112 rounded-full blur-[96px] dark:bg-primary/6" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_0%,transparent)_0%,transparent_18%,transparent_72%,color-mix(in_oklab,var(--background)_88%,transparent)_100%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_42%,color-mix(in_oklab,var(--background)_55%,transparent)_100%)] opacity-80 dark:opacity-90" />
    </div>
  );
}

export function LegalPage({
  title,
  description,
  lastUpdated = LEGAL_LAST_UPDATED,
  activePage,
  children,
}: LegalPageProps) {
  return (
    <div className="relative min-h-svh">
      <LegalPageBackground />

      <nav
        data-legal-nav
        className="fixed top-5.5 md:top-8 left-1/2 z-20 h-12 md:h-14 w-[calc(100%-40px)] md:w-180 -translate-x-1/2 rounded-full overflow-hidden"
      >
        <div className="bg-secondary/90 flex h-full w-full items-center justify-between rounded-full pl-2.5 pr-2.5 backdrop-blur-xl md:pr-3">
          <Link
            href="/"
            className="ml-2 flex h-6 items-center gap-1 md:h-7 md:gap-1.25"
          >
            <HugeiconsIcon
              icon={CircleIcon}
              className="size-5 md:size-7 shrink-0 fill-current/90 text-[#f97015]"
            />
            <span className="font-heading text-xl md:text-2xl font-semibold tracking-tighter">
              Orin
            </span>
          </Link>

          <ThemeSwitcher className="hover:bg-accent/80" />
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-28 pb-16 md:px-8 md:pt-32 md:pb-20 lg:px-10">
        <LegalArticle
          header={
            <>
              <Badge
                variant="secondary"
                className="border-border/40 bg-background/70 mb-4 rounded-full px-3 py-1 text-[11px] font-[550] tracking-wide"
              >
                Last updated {lastUpdated}
              </Badge>

              <div className="space-y-3">
                <h1 className="font-heading text-4xl font-semibold tracking-tight md:text-5xl">
                  {title}
                </h1>
                <p className="text-muted-foreground max-w-3xl text-base leading-relaxed font-[450] md:text-lg">
                  {description}
                </p>
              </div>

              <div className="bg-secondary/80 mt-6 inline-flex rounded-full p-1">
                {PAGE_LINKS.map(({ href, shortLabel, page }) => (
                  <Link
                    key={page}
                    href={href}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-[550] transition-all",
                      activePage === page
                        ? "bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {shortLabel}
                  </Link>
                ))}
              </div>
            </>
          }
        >
          {children}
        </LegalArticle>
      </main>

      <footer className="border-border/40 text-muted-foreground relative z-10 border-t px-6 py-8 text-sm font-[450]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {PAGE_LINKS.map(({ href, label, page }) => (
              <Link
                key={page}
                href={href}
                className={cn(
                  "hover:text-foreground underline-offset-2 transition-colors hover:underline",
                  activePage === page && "text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
            {EXTERNAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                className="hover:text-foreground underline-offset-2 transition-colors hover:underline"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-muted-foreground/80 text-xs">
            © 2026 Orin · Built by{" "}
            <Link
              href="https://victorwilliams.me"
              target="_blank"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Victor Williams
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
