import { LandingPrompt } from "@/components/orin/landing-prompt";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-16 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-3xl flex justify-between items-center p-3 px-5 text-sm">
            <Link href="/" className="font-semibold">
              Orin
            </Link>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col gap-10 max-w-3xl w-full p-5">
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-4xl font-semibold tracking-tight">
              Meet {DEFAULT_ASSISTANT.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A voice-enabled AI companion you can text and call. Like a friend,
              associate, or companion — warm, thoughtful, and yours to customize.
            </p>
          </div>

          <LandingPrompt />
          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/chat">Start chatting</Link>
            </Button>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-12 text-muted-foreground">
          <span>Orin — your AI companion</span>
        </footer>
      </div>
    </main>
  );
}
