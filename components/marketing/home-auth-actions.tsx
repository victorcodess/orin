"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

import { Button } from "@/components/ui/button";
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
      className={cn(className)}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOut();
          router.refresh();
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
    return <LogOutButton size="sm">Log out</LogOutButton>;
  }

  return (
    <Button asChild size="sm" variant="default">
      <Link href="/auth/login">Sign in</Link>
    </Button>
  );
}

export function HomeHeroActions({
  initialIsLoggedIn,
}: {
  initialIsLoggedIn: boolean;
}) {
  const isLoggedIn = useHomeAuthState(initialIsLoggedIn);

  return (
    <>
      <Button asChild size="lg" className="w-full sm:w-auto">
        <Link href="/new">Meet Orin</Link>
      </Button>

      {isLoggedIn ? (
        <LogOutButton size="lg" variant="secondary" className="w-full sm:w-auto">
          Log out
        </LogOutButton>
      ) : (
        <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      )}
    </>
  );
}
