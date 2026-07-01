import { cache } from "react";
import { headers } from "next/headers";

export const ORIN_AUTH_HEADER = "x-orin-authed";

export const getRequestIsLoggedIn = cache(async () => {
  return (await headers()).get(ORIN_AUTH_HEADER) === "1";
});
