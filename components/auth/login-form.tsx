"use client";

import Link from "next/link";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import {
  getLoginPageCopy,
  type AuthIntent,
} from "@/lib/auth/login-intent";
import { buildLoginHref } from "@/lib/auth/return-url";
import { cn } from "@/lib/utils";

export function LoginForm({
  returnUrl,
  intent = "login",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  returnUrl?: string;
  intent?: AuthIntent;
}) {
  const copy = getLoginPageCopy(intent);
  const alternateIntent: AuthIntent = intent === "signup" ? "login" : "signup";

  return (
    <div
      className={cn("flex w-full max-w-md flex-col gap-8", className)}
      {...props}
    >
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
          {copy.title}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed font-[450] md:text-base">
          {copy.description}
        </p>
      </div>

      <GoogleAuthButton returnUrl={returnUrl} label={copy.buttonLabel} />

      <p className="text-muted-foreground text-center text-sm font-[450] -mt-2">
        {intent === "signup" ? "Already have an account?" : "New to Orin?"}{" "}
        <Link
          href={buildLoginHref({ returnUrl, intent: alternateIntent })}
          className="text-foreground hover:text-primary font-medium underline-offset-2 hover:underline"
        >
          {intent === "signup" ? "Log in" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}
