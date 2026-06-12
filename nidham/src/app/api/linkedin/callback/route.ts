// ============================================================================
// /api/linkedin/callback — finish OAuth: exchange code → token → store
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode, fetchUserInfo } from "@/lib/linkedin";

export const dynamic = "force-dynamic";

function backToSettings(req: Request, params: Record<string, string>) {
  const url = new URL("/dashboard/settings/linkedin", req.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  res.cookies.delete("li_oauth_state");
  return res;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");

  if (oauthError) {
    return backToSettings(req, { error: `لينكد إن رفض الربط: ${oauthError}` });
  }

  // CSRF check
  const cookieHeader = req.headers.get("cookie") || "";
  const stateCookie = /(?:^|;\s*)li_oauth_state=([^;]+)/.exec(cookieHeader)?.[1];
  if (!code || !state || !stateCookie || state !== stateCookie) {
    return backToSettings(req, { error: "جلسة الربط انتهت — جرّب تاني" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
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
    .select("client_id, client_secret")
    .eq("company_id", profile.company_id)
    .maybeSingle();
  if (!conn?.client_id || !conn?.client_secret) {
    return backToSettings(req, { error: "بيانات التطبيق ناقصة — احفظها الأول" });
  }

  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.nidhamhr.com"
  ).replace(/\/$/, "");

  const token = await exchangeCode({
    code,
    clientId: conn.client_id,
    clientSecret: conn.client_secret,
    redirectUri: `${site}/api/linkedin/callback`,
  });
  if (!token.ok) {
    return backToSettings(req, { error: `فشل استبدال التوكن: ${token.error}` });
  }

  const me = await fetchUserInfo(token.accessToken);
  if (!me.ok) {
    return backToSettings(req, { error: `فشل قراءة الحساب: ${me.error}` });
  }

  const { error: upErr } = await supabase
    .from("linkedin_connections")
    .update({
      access_token: token.accessToken,
      token_expires_at: token.expiresAt,
      member_urn: `urn:li:person:${me.sub}`,
      member_name: me.name,
      connected_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("company_id", profile.company_id);

  if (upErr) {
    return backToSettings(req, { error: upErr.message });
  }

  return backToSettings(req, { connected: "1" });
}
