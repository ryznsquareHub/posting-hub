import { z } from "zod";

import { supabase } from "../supabase/client";
import { mapCampaign, mapVariant } from "../supabase/mappers";
import type { Campaign, VariantPreset } from "@/types/campaign";

const CampaignInputSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  region: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  clientNote: z.string().max(500).optional(),
  startedAt: z.string().optional(),
  brand: z.string().max(200).optional(),
  platforms: z
    .array(z.enum(["NAVER_BLOG", "NAVER_CAFE"]))
    .default([]),
  cta: z.string().max(500).optional(),
  tone: z.string().max(200).optional(),
  audience: z.string().max(200).optional(),
  keywords: z.array(z.string()).default([]),
  activeVariantId: z.string().optional(),
});

export type CampaignInput = z.infer<typeof CampaignInputSchema>;

export async function listCampaigns(): Promise<Campaign[]> {
  const sb = supabase();
  const [{ data: campaigns, error: cErr }, { data: links, error: lErr }, { data: variants, error: vErr }] =
    await Promise.all([
      sb.from("campaigns").select("*").order("started_at", { ascending: false }),
      sb.from("campaign_variants").select("campaign_id, variant_id"),
      sb.from("variant_presets").select("*"),
    ]);
  if (cErr) throw cErr;
  if (lErr) throw lErr;
  if (vErr) throw vErr;

  const variantMap = new Map<string, VariantPreset>(
    (variants ?? []).map((v) => [v.id, mapVariant(v)]),
  );
  const linkMap = new Map<string, VariantPreset[]>();
  for (const link of links ?? []) {
    const v = variantMap.get(link.variant_id);
    if (!v) continue;
    const arr = linkMap.get(link.campaign_id) ?? [];
    arr.push(v);
    linkMap.set(link.campaign_id, arr);
  }
  return (campaigns ?? []).map((c) =>
    mapCampaign(c, linkMap.get(c.id) ?? []),
  );
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const sb = supabase();
  const { data, error } = await sb
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [{ data: links }, { data: variants }] = await Promise.all([
    sb.from("campaign_variants").select("variant_id").eq("campaign_id", id),
    sb.from("variant_presets").select("*"),
  ]);
  const variantMap = new Map(
    (variants ?? []).map((v) => [v.id, mapVariant(v)]),
  );
  const cVariants = (links ?? [])
    .map((l) => variantMap.get(l.variant_id))
    .filter((v): v is VariantPreset => Boolean(v));
  return mapCampaign(data, cVariants);
}

export async function createCampaign(
  input: CampaignInput,
  ownerId: string,
): Promise<Campaign> {
  const parsed = CampaignInputSchema.parse(input);
  const sb = supabase();
  const { data, error } = await sb
    .from("campaigns")
    .insert({
      id: parsed.id,
      owner_id: ownerId,
      name: parsed.name,
      region: parsed.region ?? null,
      industry: parsed.industry ?? null,
      color: parsed.color ?? null,
      client_note: parsed.clientNote ?? null,
      brand: parsed.brand ?? null,
      platforms: parsed.platforms,
      cta: parsed.cta ?? null,
      tone: parsed.tone ?? null,
      audience: parsed.audience ?? null,
      keywords: parsed.keywords,
      active_variant_id: parsed.activeVariantId ?? null,
      started_at: parsed.startedAt ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCampaign(data);
}

export async function listVariantPresets(): Promise<VariantPreset[]> {
  const sb = supabase();
  const { data, error } = await sb.from("variant_presets").select("*");
  if (error) throw error;
  return (data ?? []).map(mapVariant);
}
