"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

import { buildLoginHref, completeLogout } from "@/lib/auth/return-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth-store";

function useHomeAuthState(initialIsLoggedIn: boolean) {
  const userId = useAuthStore((state) => state.userId);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return userId === undefined ? initialIsLoggedIn : isLoggedIn;
}

export function HomeAuthInit() {
  useEffect(() => {
    if (useAuthStore.getState().userId !== undefined) {
      return;
    }

    return useAuthStore.getState().init();
  }, []);

  return null;
}

function ButtonSkeleton({
  label,
  size,
  variant = "secondary",
  className,
}: {
  label: string;
  size: "sm" | "lg";
  variant?: "default" | "secondary";
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        buttonVariants({ size, variant }),
        "animate-pulse bg-secondary/60 text-transparent select-none pointer-events-none",
        className,
      )}
    >
      {label}
    </div>
  );
}

export function HomeNavActionsSkeleton() {
  return (
    <div className="flex items-center gap-1.5">
      <ButtonSkeleton label="Log in" size="sm" variant="secondary" />
      <ButtonSkeleton label="Say hello" size="sm" variant="default" />
    </div>
  );
}

export function HomeHeroSecondarySkeleton() {
  return (
    <ButtonSkeleton
      label="Create account"
      size="lg"
      variant="secondary"
      className="w-full sm:w-auto"
    />
  );
}

function LogOutButton({
  className,
  children = "Log out",
  ...props
}: React.ComponentProps<typeof Button>) {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      className={className}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await completeLogout(router, signOut);
        });
      }}
      {...props}
    >
      {isPending ? "Logging out..." : children}
    </Button>
  );
}

export function HomeNavActions({
  initialIsLoggedIn,
}: {
  initialIsLoggedIn: boolean;
}) {
  const isLoggedIn = useHomeAuthState(initialIsLoggedIn);

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-1.5">
        <LogOutButton
          size="sm"
          variant="secondary"
          className="bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/5"
        >
          Log out
        </LogOutButton>
        <Button asChild size="sm" variant="default">
          <Link href="/new">Say hello</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button asChild size="sm" variant="secondary" className="bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/5">
        <Link href={buildLoginHref({ intent: "login" })}>Log in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/new">Say hello</Link>
      </Button>
    </div>
  );
}

export function HomeHeroSecondaryAction({
  initialIsLoggedIn,
}: {
  initialIsLoggedIn: boolean;
}) {
  const isLoggedIn = useHomeAuthState(initialIsLoggedIn);

  if (isLoggedIn) {
    return (
      <LogOutButton size="lg" variant="secondary" className="w-full sm:w-auto">
        Log out
      </LogOutButton>
    );
  }

  return (
    <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
      <Link href={buildLoginHref({ intent: "signup" })}>Create account</Link>
    </Button>
  );
}
