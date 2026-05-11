/**
 * Edge Function `hook-intake` — bundle 단일 파일 (Management API deploy 용).
 * Multi-file source (index.ts + _shared/*) 를 inline 한 빌드 결과물.
 * 코드 수정은 `index.ts` + `_shared/*` 에 하고, 이 파일은 직접 편집 X — 빌드 스크립트로 재생성.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

// Deno 글로벌은 Edge Runtime native — type-only declare 제거 (transpile 안전성)

const ENV = (k: string): string | undefined => Deno.env.get(k);

// ── from _shared/cors.ts ───────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── from _shared/parser.ts ─────────────────────────────────────────────
type Platform = "NAVER_BLOG" | "NAVER_CAFE";
type Kind = "original" | "variant" | "recycled";
type ParseStatus = "ok" | "warn" | "error";

interface ParsedPost {
  campaign: string;
  platform: Platform;
  kind: Kind;
  keywords: string[];
  region: string;
  industry: string;
  cta: string;
  title: string;
  body: string;
  parseStatus: ParseStatus;
  warnings: string[];
}

const FIELD_RE = /^#([A-Z_]+):\s*(.*)$/;

function platformFromTag(v: string): Platform {
  const u = v.trim().toUpperCase();
  if (u === "BLOG" || u === "NAVER_BLOG") return "NAVER_BLOG";
  if (u === "CAFE" || u === "NAVER_CAFE") return "NAVER_CAFE";
  return "NAVER_BLOG";
}

function kindFromTag(v: string): Kind {
  const t = v.trim();
  if (t.includes("변형")) return "variant";
  if (t.includes("재활용")) return "recycled";
  return "original";
}

function parseSingle(raw: string): ParsedPost {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const warnings: string[] = [];
  const fields: Record<string, string> = {};
  let bodyStart = -1;
  let title = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = FIELD_RE.exec(line);
    if (m) {
      fields[m[1].toUpperCase()] = m[2].trim();
      continue;
    }
    const tm = /^제목\s*:\s*(.*)$/.exec(line);
    if (tm) {
      title = tm[1].trim();
      continue;
    }
    if (/^본문\s*:\s*$/.test(line.trim())) {
      bodyStart = i + 1;
      break;
    }
  }

  let body = "";
  if (bodyStart >= 0) {
    body = lines.slice(bodyStart).join("\n").trim();
  } else {
    body = lines
      .filter((l) => !FIELD_RE.test(l) && !/^제목\s*:/.test(l))
      .join("\n")
      .trim();
    if (body) warnings.push("본문: 마커 누락");
  }

  if (!title) warnings.push("제목 누락");
  if (!body) warnings.push("본문 누락");
  if (!fields.CAMPAIGN) warnings.push("#CAMPAIGN 누락");
  if (!fields.PLATFORM) warnings.push("#PLATFORM 누락");
  if (!fields.KIND) warnings.push("#KIND 누락");
  if (!fields.CTA) warnings.push("#CTA 누락");

  let parseStatus: ParseStatus = "ok";
  if (!title || !body) parseStatus = "error";
  else if (warnings.length > 0) parseStatus = "warn";

  return {
    campaign: fields.CAMPAIGN ?? "",
    platform: platformFromTag(fields.PLATFORM ?? ""),
    kind: kindFromTag(fields.KIND ?? ""),
    keywords: (fields.KEYWORDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    region: fields.REGION ?? "",
    industry: fields.INDUSTRY ?? "",
    cta: fields.CTA ?? "",
    title,
    body,
    parseStatus,
    warnings,
  };
}

function parseBatch(raw: string): ParsedPost[] {
  const chunks = raw
    .split(/^\s*(?:-{3,}|={3,})\s*$/m)
    .map((c) => c.trim())
    .filter(Boolean);
  return chunks.map(parseSingle);
}

// ── main handler ────────────────────────────────────────────────────────
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
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function nanoid(): string {
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return "in_" + Array.from(a).map((b) => b.toString(36)).join("");
}

Deno.serve(async (req: Request) => {
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

  let ownerId: string | null = null;
  let hookId: string | null = null;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (sharedSecret && bearer && bearer === sharedSecret) {
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

  const parsed = parseBatch(raw);
  const t0 = performance.now();

  const { data: campaigns } = await admin
    .from("campaigns")
    .select("id, name")
    .eq("owner_id", ownerId);
  const campMap = new Map<string, string>(
    (campaigns ?? []).map((c: { id: string; name: string }) => [
      c.name.trim().toLowerCase(),
      c.id,
    ]),
  );

  const insertedEvents: string[] = [];
  const insertedPosts: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const p = parsed[i];
    const rawHash = await sha256Hex(raw + "::" + i);
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
      // @ts-expect-error postgres error code on supabase response
      if (evErr.code === "23505") continue;
      // @ts-expect-error
      errors.push(`event ${i}: ${evErr.message}`);
      continue;
    }
    insertedEvents.push(eventId);

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
      // @ts-expect-error
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
