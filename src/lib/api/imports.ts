import { supabase } from "../supabase/client";
import { mapImport } from "../supabase/mappers";
import type { ImportBatch } from "@/types/intake";

export async function listImports(limit = 50): Promise<ImportBatch[]> {
  const { data, error } = await supabase()
    .from("imports")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapImport);
}
