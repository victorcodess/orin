import { cn } from "@/lib/utils";

function MarketingInsetBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden md:rounded-[inherit] opacity-50 md:opacity-30 rotate-180 -scale-x-100"
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

type MarketingInsetLayoutProps = {
  children: React.ReactNode;
  nav?: React.ReactNode;
  footer?: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
  className?: string;
  panelClassName?: string;
};

export function MarketingInsetLayout({
  children,
  nav,
  footer,
  scrollable = false,
  centered = false,
  className,
  panelClassName,
}: MarketingInsetLayoutProps) {
  const hasNav = Boolean(nav);

  return (
    <main
      data-marketing-inset
      className={cn(
        "bg-sidebar flex h-dvh flex-col overflow-hidden",
        hasNav ? "p-0 pt-0 sm:p-3 sm:pt-0" : "p-0 sm:p-3",
        className,
      )}
    >
      {nav}
      <div
        className={cn(
          "bg-background shadow-sidebar-foreground/5 dark:shadow-sidebar-border/5 relative flex min-h-0 w-full flex-1 flex-col overflow-hidden shadow-lg dark:shadow-xl",
          hasNav
            ? "rounded-b-none rounded-t-4xl sm:rounded-4xl"
            : "rounded-none sm:rounded-4xl",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-20 w-full bg-linear-to-t from-background/0 to-background to-75%" />
        <MarketingInsetBackground />
        <div
          className={cn(
            "relative z-10 flex min-h-0 w-full flex-1 flex-col",
            scrollable ? "overflow-y-auto" : "overflow-hidden",
            centered && "items-center justify-center",
            panelClassName,
          )}
        >
          {children}
          {footer}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 w-full bg-linear-to-b from-background/0 to-background to-75% opacity-50" />
      </div>
    </main>
  );
}
