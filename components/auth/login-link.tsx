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

type SignUpWithGoogleLinkProps = Omit<LoginLinkProps, "children" | "intent"> & {
  label?: string;
};

export function SignUpWithGoogleLink({
  label = "Sign up with Google",
  className,
  ...props
}: SignUpWithGoogleLinkProps) {
  return (
    <LoginLink
      intent="signup"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <GoogleAuthLabel>{label}</GoogleAuthLabel>
    </LoginLink>
  );
}
