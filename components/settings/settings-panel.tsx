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
  attemptSettingsNavigation,
  getSettingsRouteMeta,
  SETTINGS_ROUTES,
  useSettingsStore,
  type SettingsRoute,
} from "@/lib/settings-routes";
import { SettingsUnsavedDialog } from "@/components/settings/settings-unsaved-dialog";
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
  onNavigate,
}: {
  route: SettingsRoute;
  variant: "sidebar" | "tabs";
  onNavigate: (route: SettingsRoute) => void;
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
              onClick={() => onNavigate(item.id)}
              className={cn(
                "shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
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
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex h-10 w-full items-center gap-2.5 rounded-full px-4 text-left text-sm font-medium",
              "text-sidebar-foreground/90 focus-visible:ring-sidebar-ring/80 outline-none focus-visible:ring-2",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent/80 text-sidebar-accent-foreground"
            )}
          >
            <HugeiconsIcon
              icon={Icon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
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

  const handleNavigate = (nextRoute: SettingsRoute) => {
    if (nextRoute === route) {
      return;
    }

    attemptSettingsNavigation({ type: "route", route: nextRoute });
  };

  const handleClose = () => {
    attemptSettingsNavigation({ type: "close" });
  };

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
        'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'
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
      <SettingsUnsavedDialog />
      <div
        className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/50 duration-150 supports-backdrop-filter:backdrop-blur-sm"
        onClick={handleClose}
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
          "bg-popover text-popover-foreground ring-border/50 fixed z-50 flex overflow-hidden shadow-xl/10 ring-1 outline-none",
          "animate-in fade-in-0 zoom-in-[0.98] duration-150",
          "inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:h-[min(720px,85vh)] md:w-full md:max-w-4xl md:-translate-x-1/2 md:-translate-y-1/2",
          "md:rounded-3xl"
        )}
      >
        <aside className="border-sidebar-border/50 bg-sidebar text-sidebar-foreground hidden w-60 shrink-0 flex-col border-r md:flex">
          <div className="flex items-center px-4 py-5">
            <h2
              id="settings-panel-title"
              className="font-sans text-base font-semibold tracking-tight"
            >
              Settings
            </h2>
          </div>
          <SettingsNav route={route} variant="sidebar" onNavigate={handleNavigate} />
        </aside>

        <div className="bg-background flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 px-4 py-4 md:px-6 md:py-5">
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="md:hidden">
                <h2 className="font-sans text-lg font-semibold tracking-tight">
                  Settings
                </h2>
              </div>
              <div className="md:hidden">
                <SettingsNav route={route} variant="tabs" onNavigate={handleNavigate} />
              </div>
              <div className="hidden md:block">
                <h3 className="text-foreground font-sans text-lg font-semibold tracking-tight">
                  {meta.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {meta.description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              aria-label="Close settings"
              className="hover:bg-accent hover:dark:bg-muted absolute top-4 right-4 shrink-0 md:top-4.5 md:right-4.5"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-20 md:px-6 md:pb-16">
            <div className="mb-5 md:hidden">
              <h3 className="text-foreground font-sans text-lg font-semibold tracking-tight">
                {meta.title}
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
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
