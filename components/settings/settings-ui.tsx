"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SettingsPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto flex w-full max-w-2xl flex-col gap-6", className)}
    >
      {children}
    </div>
  );
}

export function SettingsGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/40 bg-secondary/30 overflow-hidden rounded-3xl border",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsRow({
  title,
  description,
  children,
  className,
  withSeparator = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  withSeparator?: boolean;
}) {
  return (
    <>
      {withSeparator ? <Separator className="bg-border/40" /> : null}
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <div className="min-w-0 sm:max-w-[42%]">
          <p className="text-foreground text-sm font-medium">{title}</p>
          {description ? (
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 items-center sm:max-w-[52%] sm:justify-end sm:pt-0.5">
          {children}
        </div>
      </div>
    </>
  );
}

export function SettingsSectionIntro({
  title,
  description,
  withSeparator = false,
  className,
}: {
  title: string;
  description?: string;
  withSeparator?: boolean;
  className?: string;
}) {
  return (
    <>
      {withSeparator ? <Separator className="bg-border/40" /> : null}
      <div className={cn("px-4 pt-4 pb-1", className)}>
        <p className="text-foreground text-sm font-medium">{title}</p>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function SettingsField({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
      {children}
    </div>
  );
}

export function SettingsOption({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full px-3.5 py-2 text-left text-sm font-medium transition-colors",
        "hover:bg-accent/70 border",
        active
          ? "border-primary/50 bg-primary/20 hover:bg-primary/20 text-foreground"
          : "border-border/50 bg-background/60 hover:bg-primary/5 hover:border-primary/10 text-foreground/90",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SettingsOptionGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>
  );
}

export function SettingsCardOption({
  active,
  onClick,
  title,
  description,
}: {
  active?: boolean;
  onClick?: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3.5 py-3 text-left transition-colors",
        "hover:bg-accent/60",
        active
          ? "border-primary/40 bg-primary/8"
          : "border-border/40 bg-background/50"
      )}
    >
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      ) : null}
    </button>
  );
}

export function SettingsSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input bg-background/80 h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "dark:bg-input/30 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function SettingsEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/40 bg-muted/30 text-muted-foreground rounded-xl border px-4 py-5 text-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SettingsStat({
  value,
  label,
  loading,
}: {
  value: ReactNode;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="border-border/40 bg-background/60 rounded-xl border px-4 py-4">
      {loading ? (
        <Skeleton className="h-7 w-16 rounded-full" />
      ) : (
        <p className="text-foreground text-2xl font-semibold tracking-tight">
          {value}
        </p>
      )}
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </div>
  );
}

export function SettingsActions({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div>
  );
}

export function SettingsSignInPrompt({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <SettingsEmptyState>
      <p className="text-foreground font-medium">{title}</p>
      <p className="mt-1">{description}</p>
    </SettingsEmptyState>
  );
}

export function SettingsSkeletonRows({ count = 2 }: { count?: number }) {
  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <div className="flex flex-col gap-4 px-4 py-4">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3.5 w-48 rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </SettingsGroup>
    </SettingsPage>
  );
}
