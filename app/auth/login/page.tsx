import { LoginForm } from "@/components/auth/login-form";
import { parseAuthIntent } from "@/lib/auth/login-intent";
import { safeReturnUrl } from "@/lib/auth/return-url";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const { next, intent } = await searchParams;
  const returnUrl = safeReturnUrl(next) ?? undefined;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm returnUrl={returnUrl} intent={parseAuthIntent(intent)} />
      </div>
    </div>
  );
}
