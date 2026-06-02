import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Same dual-URL story as src/lib/supabase/server.ts: the Enterprise
  // docker stack reaches Kong via its service hostname (http://kong:8000)
  // from inside the app container, while the browser uses the published
  // host port. Without this fallback, every middleware request tries to
  // hit http://localhost:8000 inside the container -- which loops back
  // to the app itself, getUser() returns null, and the user gets bounced
  // to /login immediately after signup or sign-in.
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isProtectedPage =
    path.startsWith("/dashboard") || path.startsWith("/admin");

  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 2FA gate: if user is authenticated but missing the nidham_2fa_pass
  // cookie, check whether 2FA is enabled for this account and redirect
  // to /login/2fa if so.  The cookie is set by verifyLogin2fa() after
  // a successful TOTP challenge.  Without this guard a user with 2FA
  // enabled could skip the challenge by navigating directly to /dashboard.
  if (user && isProtectedPage) {
    const twofaCookie = request.cookies.get("nidham_2fa_pass");
    if (!twofaCookie) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("two_factor_enabled")
        .eq("id", user.id)
        .single<{ two_factor_enabled: boolean | null }>();
      if (profile?.two_factor_enabled === true) {
        return NextResponse.redirect(new URL("/login/2fa", request.url));
      }
    }
  }

  return supabaseResponse;
}
