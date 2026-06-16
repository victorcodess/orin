// import { BayerDitherBackground } from "@/components/shared/bayer-dither-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

export default function Home() {
  return (
    <main className="bg-background relative flex h-full min-h-screen flex-col items-center justify-center overflow-hidden px-8">
      {/* <BayerDitherBackground shape="circle" pixelSize={5} color="#ffba08" /> */}
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
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/log-in">Log in</Link>
            </Button>
            <Button asChild size="sm" variant="default">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4 -mt-30 sm:mt-0">
        <h1 className="font-heading text-center text-5xl md:text-7xl lg:text-8xl leading-13 md:leading-16 lg:leading-24 tracking-tighter font-medium!">
          Your AI<br />Companion
          {/* Meet Orin */}
        </h1>
        <p className="mt-1 md:mt-2 text-muted-foreground max-w-xl text-center text-base md:text-lg lg:text-xl font-[450]">
          Orin is an AI friend you can actually talk to. Speak out loud, hear a
          warm voice respond, and pick up the conversation anytime.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 w-full">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/chat">Meet Orin</Link>
          </Button>

          <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
            <Link href="/auth/sign-up">Create account</Link>
          </Button>
        </div>
      </div>

      <footer className="text-muted-foreground absolute bottom-6 md:bottom-8 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-4 sm:gap-2 text-sm font-[450]">
      <ThemeSwitcher className="md:absolute -bottom-1 right-8 mb-4 md:mb-0" />
        <div className="flex w-full items-center justify-center gap-4">
          <Link
            href="https://x.com/orin__chat"
            target="_blank"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            Twitter
          </Link>
          <Link
            href="https://github.com/victorcodess/orin"
            target="_blank"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            GitHub
          </Link>
          <Link
            href="/privacy"
            className="hover:text-primary underline underline-offset-2 transition-colors"
          >
            Privacy
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row w-full items-center justify-center gap-2 sm:gap-4">
          <span className="text-muted-foreground text-sm">
            © 2026 Orin. All rights reserved
          </span>
          <span className="hidden sm:block">•</span>
          <span>
            Built by{" "}
            <Link
              href="https://victorwilliams.me"
              target="_blank"
              className="hover:text-primary underline underline-offset-2 transition-colors"
            >
              Victor Williams
            </Link>
          </span>
        </div>

       
      </footer>
    </main>
  );
}
