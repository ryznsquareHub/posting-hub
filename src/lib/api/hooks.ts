import { supabase } from "../supabase/client";
import { mapHook } from "../supabase/mappers";
import type { HookEndpoint } from "@/types/intake";

export async function listHooks(): Promise<HookEndpoint[]> {
  const { data, error } = await supabase()
    .from("hooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapHook);
}

export async function createHook(args: {
  name: string;
  ownerId: string;
  boundPrompts?: string[];
}): Promise<HookEndpoint> {
  const id = "hk_" + Math.random().toString(36).slice(2, 10);
  const urlToken = "phk_" + Math.random().toString(36).slice(2, 18);
  const { data, error } = await supabase()
    .from("hooks")
    .insert({
      id,
      owner_id: args.ownerId,
      name: args.name,
      url_token: urlToken,
      status: "live",
      auth_type: "Bearer",
      bound_prompts: args.boundPrompts ?? [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapHook(data);
}
