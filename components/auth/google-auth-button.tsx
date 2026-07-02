"use client";

import * as React from "react";
import { useTransition } from "react";

import { signInWithGoogle } from "@/app/auth/actions";
import { GoogleAuthLabel } from "@/components/auth/google-logo";
import { Button } from "@/components/ui/button";
import { getCurrentReturnUrl } from "@/lib/auth/return-url";
import { cn } from "@/lib/utils";

export const GOOGLE_SIGN_IN_LABELS = {
  login: "Log in with Google",
  signup: "Sign up with Google",
} as const;

export const GOOGLE_SIGN_IN_PENDING_LABEL = "Redirecting...";

export function useGoogleSignIn(returnUrl?: string) {
  const [isPending, startTransition] = useTransition();

  function signIn() {
    startTransition(async () => {
      await signInWithGoogle(returnUrl ?? getCurrentReturnUrl());
    });
  }

  return { signIn, isPending };
}

type GoogleSignInTriggerProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "children"
> & {
  label?: string;
  returnUrl?: string;
  pendingLabel?: string;
};

export const GoogleSignInTrigger = React.forwardRef<
  HTMLButtonElement,
  GoogleSignInTriggerProps
>(function GoogleSignInTrigger(
  {
    label = GOOGLE_SIGN_IN_LABELS.login,
    returnUrl,
    pendingLabel = GOOGLE_SIGN_IN_PENDING_LABEL,
    className,
    disabled,
    onClick,
    type = "button",
    ...props
  },
  ref
) {
  const { signIn, isPending } = useGoogleSignIn(returnUrl);

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isPending}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }
        signIn();
      }}
      {...props}
    >
      {isPending ? pendingLabel : <GoogleAuthLabel>{label}</GoogleAuthLabel>}
    </button>
  );
});

type GoogleAuthButtonProps = {
  label?: string;
  returnUrl?: string;
  className?: string;
};

export function GoogleAuthButton({
  label = GOOGLE_SIGN_IN_LABELS.login,
  returnUrl,
  className,
}: GoogleAuthButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className={cn("mx-auto w-full text-base md:w-[80%]", className)}
    >
      <GoogleSignInTrigger label={label} returnUrl={returnUrl} />
    </Button>
  );
}
