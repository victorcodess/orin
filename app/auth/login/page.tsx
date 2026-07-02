import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { parseAuthIntent } from "@/lib/auth/login-intent";
import { safeReturnUrl } from "@/lib/auth/return-url";

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const { next, intent } = await searchParams;
  const returnUrl = safeReturnUrl(next) ?? undefined;

  return <LoginForm returnUrl={returnUrl} intent={parseAuthIntent(intent)} />;
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
