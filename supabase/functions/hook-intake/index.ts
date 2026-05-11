/**
 * POST /functions/v1/hook-intake
 *
 * Claude 결과 (구조화 출력) 를 받아 intake_events + (조건부) posts 등록.
 *
 * 인증:
 *   - Header `Authorization: Bearer <HOOK_SHARED_SECRET>` 또는
 *   - Query `?t=<url_token>` (hooks.url_token 과 매칭)
 *
 * 요청 body:
 *   { ownerId: string, raw: string, hookId?: string, promptId?: string }
 *   또는
 *   text/plain (raw 자체)
 *
 * 멱등성: (owner_id, raw_hash) UNIQUE 제약으로 동일 raw 중복 방지.
 */

// @ts-expect-error Deno 환경 — 로컬 tsc 미해결
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// @ts-expect-error Deno 환경
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsHeaders } from "../_shared/cors.ts";
import { parseBatch } from "../_shared/parser.ts";

// @ts-expect-error Deno global
const ENV = (k: string): string | undefined => Deno.env.get(k);

interface HookInput {
  ownerId?: string;
  raw?: string;
  hookId?: string;
  promptId?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  // @ts-expect-error Deno crypto
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function nanoid(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return "in_" + Array.from(a).map((b) => b.toString(36)).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  const url = new URL(req.url);
  const sharedSecret = ENV("HOOK_SHARED_SECRET");
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(authHeader)?.[1];
  const urlToken = url.searchParams.get("t") ?? undefined;

  const supabaseUrl = ENV("SUPABASE_URL");
  const serviceKey = ENV("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json(500, { ok: false, error: "missing_supabase_env" });
  }

  // 인증: Bearer 일치하면 통과. 아니면 url token 으로 hooks 테이블 검증.
  let ownerId: string | null = null;
  let hookId: string | null = null;

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (sharedSecret && bearer && bearer === sharedSecret) {
    // 글로벌 secret 매치 — body 의 ownerId 가 필요
    const peek = (await req.clone().json().catch(() => ({}))) as HookInput;
    if (!peek.ownerId) {
      return json(400, { ok: false, error: "ownerId_required_for_bearer" });
    }
    ownerId = peek.ownerId;
    hookId = peek.hookId ?? null;
  } else if (urlToken) {
    const { data: hook, error: hookErr } = await admin
      .from("hooks")
      .select("id, owner_id, status")
      .eq("url_token", urlToken)
      .maybeSingle();
    if (hookErr || !hook) {
      return json(401, { ok: false, error: "invalid_token" });
    }
    if (hook.status === "off") {
      return json(403, { ok: false, error: "hook_disabled" });
    }
    ownerId = hook.owner_id;
    hookId = hook.id;
  } else {
    return json(401, { ok: false, error: "unauthorized" });
  }

  // Body 추출
  let raw = "";
  let promptId: string | null = null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as HookInput;
    raw = body.raw ?? "";
    promptId = body.promptId ?? null;
  } else {
    raw = await req.text();
  }
  if (!raw || !raw.trim()) {
    return json(400, { ok: false, error: "empty_body" });
  }

  // Parse — 다중 글 지원
  const parsed = parseBatch(raw);
  const t0 = performance.now();

  // 캠페인 매칭: name 기반 (단순 LIKE). production 에선 owner 전용 cache 권장.
  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id, name")
    .eq("owner_id", ownerId);
  const campMap = new Map<string, string>(
    (campaigns ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]),
  );

  const insertedEvents: string[] = [];
  const insertedPosts: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const rawSlice = raw + "::" + i; // 다중 글 idempotency
    const rawHash = await sha256Hex(rawSlice);

    const campaignMatchedId = p.campaign
      ? (campMap.get(p.campaign.trim().toLowerCase()) ?? null)
      : null;

    const eventId = nanoid();
    const { error: evErr } = await admin.from("intake_events").insert({
      id: eventId,
      owner_id: ownerId,
      source: "hook",
      hook_id: hookId,
      prompt_id: promptId,
      prompt_name: null,
      title: p.title || "(제목 누락)",
      campaign_id: campaignMatchedId,
      campaign_matched: p.campaign || null,
      platform: p.platform,
      parse_status: p.parseStatus,
      warnings: p.warnings,
      queued: p.parseStatus !== "error",
      latency_ms: Math.round(performance.now() - t0),
      raw_hash: rawHash,
      raw_body: raw,
    });

    if (evErr) {
      // 멱등성 충돌 → 무시 (이미 처리됨)
      if (evErr.code === "23505") continue;
      errors.push(`event ${i}: ${evErr.message}`);
      continue;
    }
    insertedEvents.push(eventId);

    // parseStatus 가 ok 면 posts 자동 등록
    if (p.parseStatus === "ok" && campaignMatchedId) {
      const postId = "p_" + nanoid().slice(3);
      const { error: postErr } = await admin.from("posts").insert({
        id: postId,
        owner_id: ownerId,
        campaign_id: campaignMatchedId,
        title: p.title,
        body: p.body,
        platform: p.platform,
        kind: p.kind,
        keywords: p.keywords,
        region: p.region || null,
        industry: p.industry || null,
        cta: p.cta || null,
        status: "ready",
        copy_count: 0,
        recyclable: false,
      });
      if (postErr) errors.push(`post ${i}: ${postErr.message}`);
      else insertedPosts.push(postId);
    }
  }

  return json(200, {
    ok: errors.length === 0,
    ingested: insertedEvents.length,
    posts: insertedPosts.length,
    errors,
  });
});
