import Link from "next/link";
import { Suspense } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";

import {
  HomeAuthInit,
  HomeHeroSecondaryAction,
  HomeHeroSecondarySkeleton,
  HomeNavActions,
  HomeNavActionsSkeleton,
} from "@/components/marketing/home-auth-actions";
import { Button } from "@/components/ui/button";
import { getRequestIsLoggedIn } from "@/lib/auth/request-session";

async function HomeNavActionsWithAuth() {
  return <HomeNavActions initialIsLoggedIn={await getRequestIsLoggedIn()} />;
}

async function HomeHeroSecondaryWithAuth() {
  return (
    <HomeHeroSecondaryAction initialIsLoggedIn={await getRequestIsLoggedIn()} />
  );
}

export function HomeContent() {
  return (
    <>
      <HomeAuthInit />
      <nav className="absolute top-5.5 md:top-8 left-1/2 z-10 h-12 md:h-14 w-[calc(100%-40px)] md:w-180 -translate-x-1/2 rounded-full overflow-hidden">
        <div className="bg-secondary backdrop-blur-xl flex h-full w-full items-center justify-between pl-2.5 pr-2.5 md:pr-4">
          <Link href="/" className="flex items-center gap-1 md:gap-1.25 ml-2 h-6 md:h-7">
            <HugeiconsIcon
              icon={CircleIcon}
              className="size-5 md:size-7 shrink-0 fill-current/90 text-[#f97015]"
            />
            <span className="text-xl md:text-2xl font-semibold tracking-tighter font-heading">Orin</span>
          </Link>

          <div className="flex items-center gap-1">
            <Suspense fallback={<HomeNavActionsSkeleton />}>
              <HomeNavActionsWithAuth />
            </Suspense>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 -mt-30 sm:mt-0">
        <h1 className="font-heading text-center text-5xl md:text-7xl lg:text-8xl leading-13 md:leading-16 lg:leading-24 tracking-tight font-semibold!">
          Meet Orin, your<br /><span>AI companion</span>
        </h1>
        <p className="mt-1 md:mt-2 text-muted-foreground max-w-xl text-center text-base md:text-lg lg:text-xl font-[450]">
          Orin is an AI friend you can actually talk to. Speak out loud, hear a
          warm voice respond, and pick up the conversation anytime.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/new">Meet Orin</Link>
          </Button>
          <Suspense fallback={<HomeHeroSecondarySkeleton />}>
            <HomeHeroSecondaryWithAuth />
          </Suspense>
        </div>
      </div>
    </>
  );
}
