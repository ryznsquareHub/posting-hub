import { z } from "zod";

import { supabase } from "../supabase/client";
import { mapPrompt } from "../supabase/mappers";
import type { Prompt } from "@/types/prompt";

const PromptInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  category: z.string().max(100).optional(),
  platform: z.enum(["NAVER_BLOG", "NAVER_CAFE"]).optional(),
  description: z.string().max(1000).optional(),
  variables: z.array(z.string()).default([]),
  outputFormat: z.string().optional(),
  body: z.string().min(1),
  webhookEnabled: z.boolean().default(false),
  autoParse: z.boolean().default(true),
  schedule: z.string().nullable().optional(),
});

export type PromptInput = z.infer<typeof PromptInputSchema>;

export async function listPrompts(): Promise<Prompt[]> {
  const { data, error } = await supabase()
    .from("prompts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPrompt);
}

export async function getPrompt(id: string): Promise<Prompt | null> {
  const { data, error } = await supabase()
    .from("prompts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPrompt(data) : null;
}

export async function createPrompt(
  input: PromptInput,
  ownerId: string,
): Promise<Prompt> {
  const p = PromptInputSchema.parse(input);
  const { data, error } = await supabase()
    .from("prompts")
    .insert({
      id: p.id,
      owner_id: ownerId,
      name: p.name,
      category: p.category ?? null,
      platform: p.platform ?? null,
      description: p.description ?? null,
      variables: p.variables,
      output_format: p.outputFormat ?? null,
      body: p.body,
      webhook_enabled: p.webhookEnabled,
      auto_parse: p.autoParse,
      schedule: p.schedule ?? null,
      uses: 0,
      last_run_at: null,
      last_run_status: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapPrompt(data);
}
