import Link from "next/link";
import { Suspense } from "react";

import {
  HomeAuthInit,
  HomeHeroSecondaryAction,
  HomeHeroSecondarySkeleton,
} from "@/components/marketing/home-auth-actions";
// import { HomeNav } from "@/components/marketing/home-nav";
import { Button } from "@/components/ui/button";
import { getRequestIsLoggedIn } from "@/lib/auth/request-session";

async function HomeHeroSecondaryWithAuth() {
  return (
    <HomeHeroSecondaryAction initialIsLoggedIn={await getRequestIsLoggedIn()} />
  );
}

export function HomeContent() {
  return (
    <>
      <HomeAuthInit />
      {/* <HomeNav /> */}

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 -mt-30 sm:-mt-20">
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
