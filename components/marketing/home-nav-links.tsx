"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  MARKETING_LEGAL_LINKS,
  MARKETING_SOCIAL_LINKS,
} from "@/components/marketing/marketing-links";
import { cn } from "@/lib/utils";

const navLinkClass =
  "underline-offset-2 transition-colors hover:underline hover:text-primary";

export function HomeNavLinks() {
  const pathname = usePathname();

  return (
    <div className="text-muted-foreground/80 absolute top-1/2 left-1/2 hidden w-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-10 text-sm font-medium md:flex">
      {MARKETING_LEGAL_LINKS.map(({ href, label, page }) => {
        const isActive = pathname === href;

        return (
          <Link
            key={page}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              navLinkClass,
              "whitespace-nowrap",
              isActive && "text-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
      {MARKETING_SOCIAL_LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={navLinkClass}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
