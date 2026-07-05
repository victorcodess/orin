import Link from "next/link";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";

import {
  HomeNavActions,
  HomeNavActionsSkeleton,
} from "@/components/marketing/home-auth-actions";
import { HomeNavLinks } from "@/components/marketing/home-nav-links";
import { getRequestIsLoggedIn } from "@/lib/auth/request-session";

async function HomeNavActionsWithAuth() {
  return <HomeNavActions initialIsLoggedIn={await getRequestIsLoggedIn()} />;
}

export function HomeNav() {
  return (
    <nav className="mx-auto my-auto h-12 w-[calc(100%-20px)] overflow-hidden rounded-full md:h-14 md:w-[calc(100%-40px)]">
      <div className="relative flex h-full w-full items-center justify-between pr-2 pl-2 backdrop-blur-xl md:pr-2.5 md:pl-0">
        <Link href="/" className="ml-1.5 flex h-6.5 md:h-7.5 gap-1 md:gap-1.25">
          <HugeiconsIcon
            icon={CircleIcon}
            className="size-6 shrink-0 fill-current/90 text-[#f97015] md:size-7.5"
          />
          <span className="font-heading -mt-0.25 text-xl font-semibold tracking-tighter md:-mt-0.5 md:text-[26px]">
            Orin
          </span>
        </Link>

        <HomeNavLinks />

        <div className="flex items-center gap-1">
          <Suspense fallback={<HomeNavActionsSkeleton />}>
            <HomeNavActionsWithAuth />
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
