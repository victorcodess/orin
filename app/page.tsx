import { BayerDitherBackground } from "@/components/orin/bayer-dither-background";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { CircleIcon } from "@hugeicons/core-free-icons";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <main className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <BayerDitherBackground shape="circle" pixelSize={5} color="#ffba08" />
      <nav className="absolute top-8 left-1/2 z-10 h-14 w-120 -translate-x-1/2 rounded-full">
        <div className="bg-secondary flex h-14 w-full items-center justify-between rounded-full px-3.5">
          <Link href="/" className="flex items-center gap-1.25 pl-2">
            <HugeiconsIcon
              icon={CircleIcon}
              className="size-7 shrink-0 fill-current/90 text-[#f77f00]"
            />
            <span className="text-2xl font-semibold tracking-tight">Orin</span>
          </Link>

          <div className="flex items-center gap-1">
            {/* <Button asChild size="sm" variant="ghost">
              <Link href="/auth/log-in">Log in</Link>
            </Button> */}
            <Button asChild size="sm" variant="ghost">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>

            <ThemeSwitcher />

            {/* <Button asChild size="sm" variant="secondary">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button> */}
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        <h1 className="text-center text-8xl font-semibold tracking-tight">
          Your AI Companion
        </h1>
        <p className="lg text-muted-foreground max-w-xl text-center text-xl font-[450]">
          Orin is an AI friend you can actually talk to. Speak out loud, hear a
          warm voice respond, and pick up the conversation anytime.
        </p>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Button asChild size="lg">
            <Link href="/chat">Say hello</Link>
          </Button>

          <Button asChild size="lg" variant="secondary">
            <Link href="/auth/sign-up">Create account</Link>
          </Button>
        </div>
      </div>

      <footer className="text-muted-foreground absolute bottom-8 left-1/2 z-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-2 text-sm font-[450]">
        <div className="flex w-full items-center justify-center gap-4">
          {/* <span className="text-muted-foreground text-sm">
            © 2026 Orin. All rights reserved.
          </span> */}
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
        <div className="flex w-full items-center justify-center gap-4">
          <span className="text-muted-foreground text-sm">
            © 2026 Orin. All rights reserved
          </span>
          <span>•</span>
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
