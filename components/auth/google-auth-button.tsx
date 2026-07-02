"use client";

import { useTransition } from "react";

import { signInWithGoogle } from "@/app/auth/actions";
import { GoogleAuthLabel } from "@/components/auth/google-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GoogleAuthButtonProps = {
  label?: string;
  returnUrl?: string;
  className?: string;
};

export function GoogleAuthButton({
  label = "Log in with Google",
  returnUrl,
  className,
}: GoogleAuthButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="lg"
      className={cn("mx-auto w-full text-base md:w-[80%]", className)}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signInWithGoogle(returnUrl);
        });
      }}
    >
      {isPending ? (
        "Redirecting..."
      ) : (
        <GoogleAuthLabel>{label}</GoogleAuthLabel>
      )}
    </Button>
  );
}
