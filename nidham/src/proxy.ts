import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Skip the proxy for:
  // - Next.js internals (_next/static, _next/image)
  // - Common static binary types served from /public
  // - PWA manifest + service worker + offline fallback (must reach the
  //   browser unchanged for install to work — Supabase session refresh
  //   would rewrite them through a 200 → 302 chain that breaks the SW
  //   registration handshake)
  matcher: [
    // Already excluded above: PWA + static images + fonts.
    // O1 also exclude sitemap.xml + robots.txt — Next.js generates
    // both from app/sitemap.ts and app/robots.ts, but the proxy was
    // running on them and returning HTML 404. Search engines need
    // raw text/xml responses.
    //
    // .well-known/* is excluded too: Vercel serves /.well-known/vercel/jwe
    // (the deployment-protection JWE endpoint) plus other well-known URIs
    // from its own infra. If the proxy intercepts them and runs the
    // Supabase session refresh, Vercel can't serve the endpoint and it
    // returns 503. Auth never applies to .well-known, so bypass it.
    // iclock/* is the ZKTeco biometric-device push endpoint. The device has
    // no Supabase session, and it polls frequently — running the session
    // refresh + getUser() on every poll is pure overhead. Bypass it; the
    // route handler authenticates the device by its serial number instead.
    "/((?!_next/static|_next/image|favicon.ico|\\.well-known|iclock|manifest.webmanifest|sw.js|offline.html|robots.txt|sitemap.xml|sitemap-.*\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|webmanifest|xml|txt)$).*)",
  ],
};
