import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="font-semibold">
          Orin
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/chat">New chat</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
