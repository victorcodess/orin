import Link from "next/link";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";

import {
  HomeNavActions,
  HomeNavActionsSkeleton,
} from "@/components/marketing/home-auth-actions";
import { getRequestIsLoggedIn } from "@/lib/auth/request-session";
import { cn } from "@/lib/utils";

async function HomeNavActionsWithAuth() {
  return <HomeNavActions initialIsLoggedIn={await getRequestIsLoggedIn()} />;
}

export function HomeNav() {
  return (
    <nav
      className={cn(
        "mx-auto my-auto h-12 w-[calc(100%-20px)] overflow-hidden rounded-full md:h-14 md:w-[calc(100%-40px)]"
        // "absolute top-2.5 left-1/2 z-10 -translate-x-1/2 md:top-0"
      )}
    >
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
            "text-muted-foreground/80 w-fit items-center justify-center gap-10 text-sm font-medium hidden md:flex",
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        >
          <Link
            href="https://x.com/orin__chat"
            target="_blank"
            className="hover:text-primary underline-offset-2 transition-colors hover:underline"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/victorcodess/orin"
            target="_blank"
            className="hover:text-primary underline-offset-2 transition-colors hover:underline"
          >
            GitHub
          </Link>
          <Link
            href="/terms"
            className="hover:text-primary underline-offset-2 transition-colors hover:underline whitespace-nowrap"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-primary underline-offset-2 transition-colors hover:underline whitespace-nowrap"
          >
            Privacy Policy
          </Link>
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
