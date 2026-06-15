const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) { console.error("SUPABASE_URL missing"); process.exit(1); }
if (!key) { console.error("SUPABASE_SERVICE_ROLE_KEY missing"); process.exit(1); }

const email = process.argv[2] || "basemazab640@gmail.com";
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("email", email)
    .maybeSingle();
  if (!profile) {
    console.error("No profile found for email:", email);
    process.exit(1);
  }

  const companyId = profile.company_id;
  console.log("Company ID:", companyId);

  const { data, error } = await supabase.rpc("bulk_set_tenant_overrides", {
    p_company_id: companyId,
    p_overrides: JSON.stringify([
      { feature: "marketing_studio", enabled: true },
      { feature: "crm", enabled: true },
    ]),
    p_reason: "Activated via admin script — requested by system owner",
  });

  if (error) {
    console.error("RPC error:", error.message);
    process.exit(1);
  }

  console.log("Success! Rows affected:", data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
