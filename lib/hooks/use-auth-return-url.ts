"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentReturnUrl } from "@/lib/auth/return-url";

export function useAuthReturnUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, setTick] = useState(0);

  useEffect(() => {
    const sync = () => setTick((value) => value + 1);

    sync();
    window.addEventListener("hashchange", sync);

    return () => {
      window.removeEventListener("hashchange", sync);
    };
  }, [pathname, searchParams]);

  return getCurrentReturnUrl();
}
