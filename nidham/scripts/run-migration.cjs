const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) { console.error("SUPABASE_URL missing"); process.exit(1); }
if (!key) { console.error("SUPABASE_SERVICE_ROLE_KEY missing"); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });
const sql = fs.readFileSync(path.join(__dirname, "..", "db", "migrations", "090_recruitment_enhancements.sql"), "utf8");

console.log("Running migration...");
supabase.rpc("exec_sql", { sql }).then(({ data, error }) => {
  if (error) {
    // Try direct SQL via REST API
    console.error("RPC failed, trying direct query...", error.message);
    supabase.from("_migrations").select("id").limit(1).then(({ error: e2 }) => {
      if (e2) console.error("Direct query also failed:", e2.message);
      else console.log("Connected OK");
    });
  } else {
    console.log("Migration succeeded:", data);
  }
});
