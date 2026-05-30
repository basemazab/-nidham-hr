"use server";

import { createClient } from "@/lib/supabase/server";
import { searchKnowledgeBase } from "./memory";

export type KBSource = { id: string; title: string; source_type: string };

export async function getKBSearchSources(
  query: string,
): Promise<KBSource[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!profile?.company_id) return [];

  try {
    const docs = await searchKnowledgeBase(profile.company_id, query, 3);
    if (!docs || docs.length === 0) return [];
    return docs.map((d: { id: string; title: string; source_type: string }) => ({
      id: d.id,
      title: d.title,
      source_type: d.source_type,
    }));
  } catch {
    return [];
  }
}
