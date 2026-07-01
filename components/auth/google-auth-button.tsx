"use client";

import { useTransition } from "react";

import { signInWithGoogle } from "@/app/auth/actions";
import { GoogleAuthLabel } from "@/components/auth/google-logo";
import { Button } from "@/components/ui/button";

type GoogleAuthButtonProps = {
  label?: string;
  returnUrl?: string;
};

export function GoogleAuthButton({
  label = "Log in with Google",
  returnUrl,
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
