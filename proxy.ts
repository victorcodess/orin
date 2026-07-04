import { updateSession } from "@/lib/supabase/proxy";
import { checkApiRateLimit } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const limited = checkApiRateLimit({
    pathname: request.nextUrl.pathname,
    method: request.method,
    headers: request.headers,
  });

  if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
