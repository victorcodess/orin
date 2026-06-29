"use client";

import {
  Cancel01Icon,
  Coins01Icon,
  MagicWand01Icon,
  Settings02Icon,
  UserCircle02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef } from "react";

import { SettingsAccount } from "@/components/settings/settings-account";
import { SettingsGeneral } from "@/components/settings/settings-general";
import { SettingsPersonalization } from "@/components/settings/settings-personalization";
import { SettingsUsage } from "@/components/settings/settings-usage";
import { Button } from "@/components/ui/button";
import {
  closeSettings,
  getSettingsRouteMeta,
  SETTINGS_ROUTES,
  settingsHashForRoute,
  useSettingsStore,
  type SettingsRoute,
} from "@/lib/settings-routes";
import { cn } from "@/lib/utils";

const ROUTE_ICONS = {
  general: Settings02Icon,
  personalization: MagicWand01Icon,
  account: UserCircle02Icon,
  usage: Coins01Icon,
} as const;

function SettingsNav({
  route,
  variant,
}: {
  route: SettingsRoute;
  variant: "sidebar" | "tabs";
}) {
  if (variant === "tabs") {
    return (
      <div className="-mx-1 flex gap-1.5 overflow-x-auto pb-1">
        {SETTINGS_ROUTES.map((item) => {
          const active = route === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                window.location.hash = settingsHashForRoute(item.id).slice(1);
              }}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium cursor-pointer",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-4">
      {SETTINGS_ROUTES.map((item) => {
        const Icon = ROUTE_ICONS[item.id];
        const active = route === item.id;

        return (
          <button
            key={item.id}
            type="button"
            data-active={active}
            onClick={() => {
              window.location.hash = settingsHashForRoute(item.id).slice(1);
            }}
            className={cn(
              "flex h-10 w-full items-center gap-2.5 rounded-full px-4 text-left text-sm font-medium",
              "text-sidebar-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/80",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent/80 text-sidebar-accent-foreground",
            )}
          >
            <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function SettingsRoutes({ route }: { route: SettingsRoute }) {
  return (
    <>
      <div className={cn(route !== "general" && "hidden")}>
        <SettingsGeneral />
      </div>
      <div className={cn(route !== "personalization" && "hidden")}>
        <SettingsPersonalization />
      </div>
      <div className={cn(route !== "account" && "hidden")}>
        <SettingsAccount />
      </div>
      <div className={cn(route !== "usage" && "hidden")}>
        <SettingsUsage />
      </div>
    </>
  );
}

export function SettingsPanel() {
  const route = useSettingsStore((state) => state.route);
  const panelRef = useRef<HTMLDivElement>(null);

  const open = route !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus({ preventScroll: true });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleTab);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!route) {
    return null;
  }

  const meta = getSettingsRouteMeta(route);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={closeSettings}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        data-slot="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        tabIndex={-1}
        className={cn(
          "fixed z-50 flex overflow-hidden bg-popover text-popover-foreground shadow-xl/10 ring-1 ring-border/50 outline-none",
          "animate-in fade-in-0 zoom-in-[0.98] duration-150",
          "inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:h-[min(720px,85vh)] md:w-full md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2",
          "md:rounded-3xl",
        )}
      >
        <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground md:flex">
          <div className="flex items-center px-4 py-5">
            <h2
              id="settings-panel-title"
              className="font-sans text-base font-semibold tracking-tight"
            >
              Settings
            </h2>
          </div>
          <SettingsNav route={route} variant="sidebar" />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
          <div className="flex items-start justify-between gap-4 px-4 py-4 md:px-6 md:py-5">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="md:hidden">
                <h2 className="font-sans text-lg font-semibold tracking-tight">
                  Settings
                </h2>
              </div>
              <div className="md:hidden">
                <SettingsNav route={route} variant="tabs" />
              </div>
              <div className="hidden md:block">
                <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                  {meta.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {meta.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeSettings}
              aria-label="Close settings"
              className="shrink-0 hover:bg-accent hover:dark:bg-muted absolute top-4 md:top-4.5 right-4 md:right-4.5"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 md:px-6 md:pb-8">
            <div className="mb-5 md:hidden">
              <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground">
                {meta.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {meta.description}
              </p>
            </div>
            <SettingsRoutes route={route} />
          </div>
        </div>
      </div>
    </>
  );
}
