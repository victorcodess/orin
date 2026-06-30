"use client";

import { useTransition } from "react";

import { signInWithGoogle } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

type GoogleAuthButtonProps = {
  label?: string;
};

export function GoogleAuthButton({
  label = "Continue with Google",
}: GoogleAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signInWithGoogle();
        });
      }}
    >
      {isPending ? "Redirecting..." : label}
    </Button>
  );
}
