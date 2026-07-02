"use client";

import Link from "next/link";

import { GoogleAuthLabel } from "@/components/auth/google-logo";
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

type GoogleAuthLinkProps = Omit<LoginLinkProps, "children" | "intent"> & {
  intent?: AuthIntent;
  label?: string;
};

function GoogleAuthLink({
  intent = "login",
  label,
  className,
  ...props
}: GoogleAuthLinkProps) {
  const resolvedLabel =
    label ?? (intent === "signup" ? "Sign up with Google" : "Log in with Google");

  return (
    <LoginLink
      intent={intent}
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <GoogleAuthLabel>{resolvedLabel}</GoogleAuthLabel>
    </LoginLink>
  );
}

export function SignUpWithGoogleLink(props: Omit<GoogleAuthLinkProps, "intent">) {
  return <GoogleAuthLink intent="signup" {...props} />;
}

export function LoginWithGoogleLink(props: Omit<GoogleAuthLinkProps, "intent">) {
  return <GoogleAuthLink intent="login" {...props} />;
}
