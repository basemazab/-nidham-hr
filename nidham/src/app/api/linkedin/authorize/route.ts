// ============================================================================
// /api/linkedin/authorize — start the LinkedIn OAuth dance for the tenant
// ============================================================================
// Reads the tenant's own LinkedIn App credentials (saved in settings), sets a
// CSRF state cookie, and redirects to LinkedIn's consent screen.

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { buildAuthorizeUrl } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single<{ role: string; company_id: string }>();
  if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const { data: conn } = await supabase
    .from("linkedin_connections")
    .select("client_id")
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (!conn?.client_id) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/settings/linkedin?error=" +
          encodeURIComponent("احفظ Client ID و Client Secret الأول"),
        req.url,
      ),
    );
  }

  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
  ).replace(/\/$/, "");
  const redirectUri = `${site}/api/linkedin/callback`;
  const state = randomUUID();

  const res = NextResponse.redirect(
    buildAuthorizeUrl({ clientId: conn.client_id, redirectUri, state }),
  );
  // CSRF: callback must present the same state. 10-minute window.
  res.cookies.set("li_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/api/linkedin",
  });
  return res;
}
