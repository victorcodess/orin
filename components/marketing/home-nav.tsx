import Link from "next/link";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";

import {
  HomeNavActions,
  HomeNavActionsSkeleton,
} from "@/components/marketing/home-auth-actions";
import {
  MARKETING_LEGAL_LINKS,
  MARKETING_SOCIAL_LINKS,
} from "@/components/marketing/marketing-links";
import { getRequestIsLoggedIn } from "@/lib/auth/request-session";
import { cn } from "@/lib/utils";

async function HomeNavActionsWithAuth() {
  return <HomeNavActions initialIsLoggedIn={await getRequestIsLoggedIn()} />;
}

const navLinkClass =
  "hover:text-primary underline-offset-2 transition-colors hover:underline";

export function HomeNav() {
  return (
    <nav className="mx-auto my-auto h-12 w-[calc(100%-20px)] overflow-hidden rounded-full md:h-14 md:w-[calc(100%-40px)]">
      <div className="relative flex h-full w-full items-center justify-between pr-2 pl-2 backdrop-blur-xl md:pr-2.5 md:pl-0">
        <Link href="/" className="ml-1.5 flex h-7.5 gap-1 md:gap-1.25">
          <HugeiconsIcon
            icon={CircleIcon}
            className="size-6 shrink-0 fill-current/90 text-[#f97015] md:size-7.5"
          />
          <span className="font-heading -mt-0.25 text-xl font-semibold tracking-tighter md:-mt-0.5 md:text-[26px]">
            Orin
          </span>
        </Link>

        <div
          className={cn(
            "text-muted-foreground/80 absolute top-1/2 left-1/2 hidden w-fit -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-10 text-sm font-medium md:flex",
          )}
        >
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
          {MARKETING_LEGAL_LINKS.map(({ href, label, page }) => (
            <Link
              key={page}
              href={href}
              className={cn(navLinkClass, "whitespace-nowrap")}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Suspense fallback={<HomeNavActionsSkeleton />}>
            <HomeNavActionsWithAuth />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
