import { getMyProfile } from "@/lib/permissions";
import { RolesClient } from "./client";

export const metadata = {
  title: "الأدوار والصلاحيات",
};

export default async function RolesPage() {
  const { supabase, profile } = await getMyProfile();
  if (!profile) return null;

  const { data: roles } = await supabase
    .from("company_roles")
    .select("*")
    .eq("company_id", profile.company_id)
    .order("created_at", { ascending: true });

  const { data: permissions } = await supabase
    .from("permission_defs")
    .select("*")
    .order("module", { ascending: true });

  const { data: rolePermissions } = await supabase
    .from("company_role_permissions")
    .select("*, permission_defs!inner(code)")
    .eq("company_id", profile.company_id);

  // Build a map of role_id -> permission_id arrays. The client keys both the
  // edit checkboxes and the read-only chips off permission_defs.id, so this
  // MUST carry ids (not codes) or editing a role shows nothing checked and
  // saving wipes its permissions.
  const permMap: Record<string, string[]> = {};
  for (const rp of rolePermissions ?? []) {
    const arr = permMap[rp.role_id] ?? [];
    arr.push((rp as any).permission_id ?? "");
    permMap[rp.role_id] = arr;
  }

  return (
    <RolesClient
      roles={roles ?? []}
      permissions={permissions ?? []}
      permissionMap={permMap}
    />
  );
}
