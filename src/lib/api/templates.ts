import { supabase } from "../supabase/client";
import { mapTemplate } from "../supabase/mappers";
import type { PostTemplate } from "@/types/prompt";

export async function listTemplates(): Promise<PostTemplate[]> {
  const { data, error } = await supabase()
    .from("templates")
    .select("*")
    .order("uses", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTemplate);
}
