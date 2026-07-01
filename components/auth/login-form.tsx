"use client";

import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import {
  getLoginPageCopy,
  type AuthIntent,
} from "@/lib/auth/login-intent";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton returnUrl={returnUrl} label={copy.buttonLabel} />
        </CardContent>
      </Card>
    </div>
  );
}
