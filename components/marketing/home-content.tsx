import Link from "next/link";
import { Suspense } from "react";

import {
  HomeAuthInit,
  HomeHeroSecondaryAction,
  HomeHeroSecondarySkeleton,
} from "@/components/marketing/home-auth-actions";
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

      <div className="relative z-10 -mt-30 flex flex-col items-center justify-center gap-4 sm:-mt-20">
        <h1 className="font-heading text-center text-5xl leading-13 font-semibold! tracking-tight md:text-7xl md:leading-16 lg:text-8xl lg:leading-24">
          Meet Orin, your
          <br />
          <span>AI companion</span>
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-center text-base font-[450] md:mt-2 md:text-lg lg:text-xl">
          Orin is a warm, voice-enabled AI you can text or call. Talk out loud
          when you want to, hear a thoughtful reply, and pick up the conversation
          anytime.
        </p>

        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/new">Say hello</Link>
          </Button>
          <Suspense fallback={<HomeHeroSecondarySkeleton />}>
            <HomeHeroSecondaryWithAuth />
          </Suspense>
        </div>
      </div>
    </>
  );
}
