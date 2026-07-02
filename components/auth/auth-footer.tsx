import Link from "next/link";

import { ThemeFooter } from "@/components/marketing/theme-footer";

export function AuthFooter() {
  return (
    <ThemeFooter>
      <p className="max-w-sm text-center text-xs leading-relaxed sm:text-sm">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="text-foreground hover:text-primary underline-offset-2 transition-colors hover:underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-foreground hover:text-primary underline-offset-2 transition-colors hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </ThemeFooter>
  );
}
