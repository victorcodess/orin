import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { parseAuthIntent } from "@/lib/auth/login-intent";
import { resolveAuthReturnUrl } from "@/lib/auth/return-url";

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const { next, intent } = await searchParams;
  return (
    <LoginForm
      returnUrl={resolveAuthReturnUrl(next)}
      intent={parseAuthIntent(intent)}
    />
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  return (
    <Suspense>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}
