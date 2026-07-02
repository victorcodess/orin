"use client";

import Link from "next/link";

import {
  GOOGLE_SIGN_IN_LABELS,
  GoogleSignInTrigger,
} from "@/components/auth/google-auth-button";
import type { AuthIntent } from "@/lib/auth/login-intent";
import { buildLoginHref } from "@/lib/auth/return-url";
import { useAuthReturnUrl } from "@/lib/hooks/use-auth-return-url";
import { cn } from "@/lib/utils";

type LoginLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href?: string;
  intent?: AuthIntent;
};

export function LoginLink({ href, intent, ...props }: LoginLinkProps) {
  const returnUrl = useAuthReturnUrl();

  return (
    <Link href={href ?? buildLoginHref({ returnUrl, intent })} {...props} />
  );
}

type GoogleAuthLinkProps = Omit<
  React.ComponentPropsWithoutRef<typeof GoogleSignInTrigger>,
  "label"
> & {
  label?: string;
};

function GoogleAuthLink({ label, className, ...props }: GoogleAuthLinkProps) {
  return (
    <GoogleSignInTrigger
      label={label}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    />
  );
}

export function SignUpWithGoogleLink(
  props: Omit<GoogleAuthLinkProps, "label">
) {
  return <GoogleAuthLink label={GOOGLE_SIGN_IN_LABELS.signup} {...props} />;
}

export function LoginWithGoogleLink(
  props: Omit<GoogleAuthLinkProps, "label">
) {
  return <GoogleAuthLink label={GOOGLE_SIGN_IN_LABELS.login} {...props} />;
}
