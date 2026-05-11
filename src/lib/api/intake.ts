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
/**
 * Intake row 의 campaign_id / campaign_matched 를 갱신.
 * Hook 자동 매칭이 실패했거나 잘못 매칭됐을 때 운영자가 수동 재지정.
 */
export async function relinkIntakeCampaign(
  eventId: string,
  campaignId: string | null,
  campaignName: string | null,
): Promise<void> {
  const { error } = await supabase()
    .from("intake_events")
    .update({
      campaign_id: campaignId,
      campaign_matched: campaignName,
    })
    .eq("id", eventId);
  if (error) throw error;
}

/** 재매칭 시 raw_body 다시 파싱해 posts 로 승급할 때 사용. */
export async function getIntakeRaw(eventId: string): Promise<{
  rawBody: string | null;
  parseStatus: "ok" | "warn" | "error";
  title: string;
}> {
  const { data, error } = await supabase()
    .from("intake_events")
    .select("raw_body, parse_status, title")
    .eq("id", eventId)
    .single();
  if (error) throw error;
  return {
    rawBody: data.raw_body as string | null,
    parseStatus: data.parse_status as "ok" | "warn" | "error",
    title: data.title as string,
  };
}

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
