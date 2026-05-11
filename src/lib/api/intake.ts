import { supabase } from "../supabase/client";
import { mapIntakeEvent } from "../supabase/mappers";
import type { IntakeEvent } from "@/types/intake";

export async function listIntakeEvents(limit = 50): Promise<IntakeEvent[]> {
  const { data, error } = await supabase()
    .from("intake_events")
    .select("*")
    .order("at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapIntakeEvent);
}

/**
 * Manual paste → intake_events 직접 insert.
 * Edge Function 의 parser 와 동일한 결과를 만들어야 하지만,
 * 클라이언트 측 paste 는 owner_id 가 이미 알려져 있어 간단.
 */
export async function ingestManualPaste(args: {
  ownerId: string;
  raw: string;
  title: string;
  campaignId?: string;
  campaignMatched?: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE";
  parseStatus: "ok" | "warn" | "error";
  warnings: string[];
}): Promise<IntakeEvent> {
  const eventId = "in_" + Math.random().toString(36).slice(2, 10);
  const enc = new TextEncoder().encode(args.raw);
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  const rawHash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const { data, error } = await supabase()
    .from("intake_events")
    .insert({
      id: eventId,
      owner_id: args.ownerId,
      source: "manual",
      hook_id: null,
      prompt_id: null,
      prompt_name: "수동 paste",
      title: args.title,
      campaign_id: args.campaignId ?? null,
      campaign_matched: args.campaignMatched ?? null,
      platform: args.platform,
      parse_status: args.parseStatus,
      warnings: args.warnings,
      queued: args.parseStatus !== "error",
      latency_ms: 0,
      raw_hash: rawHash,
      raw_body: args.raw,
      at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapIntakeEvent(data);
}
