/**
 * DB row ↔ 도메인 모델 매핑.
 * Phase 1 의 도메인 타입을 Phase 2 에 그대로 유지하면서, snake_case ↔ camelCase 만 변환.
 */

import type { Campaign, VariantPreset } from "@/types/campaign";
import type { Post, PostStatus, Platform, PostKind } from "@/types/post";
import type { Prompt, PostTemplate } from "@/types/prompt";
import type { IntakeEvent, HookEndpoint, ImportBatch } from "@/types/intake";

import type {
  CampaignRow,
  PostRow,
  PostInsert,
  PromptRow,
  IntakeEventRow,
  HookRow,
  ImportRow,
  TemplateRow,
  VariantPresetRow,
} from "./types";

export function mapVariant(r: VariantPresetRow): VariantPreset {
  return {
    id: r.id,
    name: r.name,
    platform: r.platform,
    style: r.style ?? "",
    template: r.template,
  };
}

export function mapCampaign(
  c: CampaignRow,
  variants: VariantPreset[] = [],
): Campaign {
  return {
    id: c.id,
    name: c.name,
    region: c.region ?? "",
    industry: c.industry ?? "",
    color: c.color ?? "#6e7af0",
    clientNote: c.client_note ?? "",
    startedAt: c.started_at ?? "",
    settings: {
      brand: c.brand ?? c.name,
      platforms: (c.platforms as Platform[]) ?? [],
      cta: c.cta ?? "",
      tone: c.tone ?? "",
      audience: c.audience ?? "",
      keywords: c.keywords ?? [],
    },
    activeVariantId: c.active_variant_id ?? undefined,
    variants,
  };
}

export function mapPost(r: PostRow): Post {
  return {
    id: r.id,
    campaignId: r.campaign_id ?? "",
    title: r.title,
    body: r.body,
    platform: r.platform as Platform,
    kind: r.kind as PostKind,
    keywords: r.keywords ?? [],
    region: r.region ?? undefined,
    industry: r.industry ?? undefined,
    cta: r.cta ?? undefined,
    memo: r.memo ?? undefined,
    status: r.status as PostStatus,
    copyCount: r.copy_count,
    recyclable: r.recyclable,
    scheduledAt: r.scheduled_at,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

export function toPostInsert(
  p: Partial<Post> & { id: string; ownerId: string; campaignId: string; title: string; body: string; platform: Platform },
): PostInsert {
  return {
    id: p.id,
    owner_id: p.ownerId,
    campaign_id: p.campaignId,
    title: p.title,
    body: p.body,
    platform: p.platform,
    kind: p.kind ?? "original",
    keywords: p.keywords ?? [],
    region: p.region ?? null,
    industry: p.industry ?? null,
    cta: p.cta ?? null,
    memo: p.memo ?? null,
    status: p.status ?? "ready",
    copy_count: p.copyCount ?? 0,
    recyclable: p.recyclable ?? false,
    scheduled_at: p.scheduledAt ?? null,
  };
}

export function mapPrompt(r: PromptRow): Prompt {
  return {
    id: r.id,
    name: r.name,
    category: r.category ?? "",
    platform: (r.platform ?? "NAVER_BLOG") as Platform,
    description: r.description ?? "",
    variables: r.variables ?? [],
    outputFormat: r.output_format ?? "",
    body: r.body,
    webhookEnabled: r.webhook_enabled ?? false,
    autoParse: r.auto_parse ?? true,
    schedule: r.schedule,
    uses: r.uses ?? 0,
    lastRunAt: r.last_run_at,
    lastRunStatus: (r.last_run_status as Prompt["lastRunStatus"]) ?? undefined,
    lastRunCount: r.last_run_count ?? 0,
    successRate: r.success_rate ?? 0,
    updatedAt: r.updated_at ?? "",
  };
}

export function mapIntakeEvent(r: IntakeEventRow): IntakeEvent {
  return {
    id: r.id,
    at: r.at ?? new Date().toISOString(),
    source: r.source,
    promptId: r.prompt_id ?? null,
    promptName: r.prompt_name ?? (r.source === "hook" ? "Hook" : "수동 paste"),
    title: r.title ?? "(제목 없음)",
    campaignMatched: r.campaign_matched ?? undefined,
    campaignId: r.campaign_id ?? undefined,
    platform: (r.platform ?? "NAVER_BLOG") as Platform,
    parseStatus: (r.parse_status ?? "ok") as IntakeEvent["parseStatus"],
    queued: r.queued ?? false,
    latencyMs: r.latency_ms ?? 0,
    warnings: r.warnings ?? [],
  };
}

export function mapHook(r: HookRow): HookEndpoint {
  return {
    id: r.id,
    name: r.name,
    url: r.url ?? r.url_token,
    protocol: r.protocol ?? "POST · JSON",
    status: r.status,
    uptime: r.uptime ?? 1,
    lastPingAt: r.last_ping_at,
    secret: r.secret ?? "(server-side)",
    authType: r.auth_type ?? "Bearer",
    receivedToday: r.received_today ?? 0,
    errorsToday: r.errors_today ?? 0,
    p50LatencyMs: r.p50_latency_ms ?? 0,
    boundPrompts: r.bound_prompts ?? [],
  };
}

export function mapTemplate(r: TemplateRow): PostTemplate {
  return {
    id: r.id,
    platform: (r.platform ?? "NAVER_BLOG") as Platform,
    name: r.name,
    uses: r.uses ?? 0,
    updatedAt: r.updated_at ?? "",
  };
}

export function mapImport(r: ImportRow): ImportBatch {
  return {
    id: r.id,
    at: r.at ?? new Date().toISOString(),
    source: r.source,
    sourceName: r.source_name,
    count: r.count,
    parsed: r.parsed,
    status: r.status,
    summary: r.summary ?? "",
  };
}
