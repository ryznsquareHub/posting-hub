/**
 * Supabase Database types — 수동 정의 (Phase 2 시작).
 * Phase 2 종료 시점에 `npx supabase gen types typescript --local > src/lib/supabase/types.ts` 로 재생성.
 *
 * 참조: supabase/migrations/0001_init.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─────────────────────────────────────────────────────────────────────────
// Row / Insert / Update 명시적 정의 (자기참조 회피)
// ─────────────────────────────────────────────────────────────────────────

export type VariantPresetRow = {
  id: string;
  name: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE";
  style: string | null;
  template: string;
  created_at: string | null;
}

export type CampaignRow = {
  id: string;
  owner_id: string;
  name: string;
  region: string | null;
  industry: string | null;
  color: string | null;
  client_note: string | null;
  brand: string | null;
  platforms: string[];
  cta: string | null;
  tone: string | null;
  audience: string | null;
  keywords: string[];
  active_variant_id: string | null;
  started_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type CampaignInsert = {
  id: string;
  owner_id: string;
  name: string;
  region?: string | null;
  industry?: string | null;
  color?: string | null;
  client_note?: string | null;
  brand?: string | null;
  platforms?: string[];
  cta?: string | null;
  tone?: string | null;
  audience?: string | null;
  keywords?: string[];
  active_variant_id?: string | null;
  started_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type CampaignVariantRow = {
  campaign_id: string;
  variant_id: string;
}

export type PostRow = {
  id: string;
  owner_id: string;
  campaign_id: string | null;
  title: string;
  body: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE";
  kind: "original" | "variant" | "recycled";
  keywords: string[];
  region: string | null;
  industry: string | null;
  cta: string | null;
  memo: string | null;
  status: "draft" | "ready" | "scheduled" | "published" | "archived";
  copy_count: number;
  recyclable: boolean;
  scheduled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export type PostInsert = {
  id: string;
  owner_id: string;
  campaign_id: string | null;
  title: string;
  body: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE";
  kind?: "original" | "variant" | "recycled";
  keywords?: string[];
  region?: string | null;
  industry?: string | null;
  cta?: string | null;
  memo?: string | null;
  status?: "draft" | "ready" | "scheduled" | "published" | "archived";
  copy_count?: number;
  recyclable?: boolean;
  scheduled_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type PostUpdate = {
  campaign_id?: string | null;
  title?: string;
  body?: string;
  platform?: "NAVER_BLOG" | "NAVER_CAFE";
  kind?: "original" | "variant" | "recycled";
  keywords?: string[];
  region?: string | null;
  industry?: string | null;
  cta?: string | null;
  memo?: string | null;
  status?: "draft" | "ready" | "scheduled" | "published" | "archived";
  copy_count?: number;
  recyclable?: boolean;
  scheduled_at?: string | null;
  updated_at?: string | null;
}

export type PromptRow = {
  id: string;
  owner_id: string;
  name: string;
  category: string | null;
  platform: "NAVER_BLOG" | "NAVER_CAFE" | null;
  description: string | null;
  variables: string[];
  output_format: string | null;
  body: string;
  webhook_enabled: boolean | null;
  auto_parse: boolean | null;
  schedule: string | null;
  uses: number | null;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_count: number | null;
  success_rate: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export type PromptInsert = {
  id: string;
  owner_id: string;
  name: string;
  category?: string | null;
  platform?: "NAVER_BLOG" | "NAVER_CAFE" | null;
  description?: string | null;
  variables?: string[];
  output_format?: string | null;
  body: string;
  webhook_enabled?: boolean | null;
  auto_parse?: boolean | null;
  schedule?: string | null;
  uses?: number | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
}

export type TemplateRow = {
  id: string;
  owner_id: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE" | null;
  name: string;
  uses: number | null;
  updated_at: string | null;
}

export type HookRow = {
  id: string;
  owner_id: string;
  name: string;
  url_token: string;
  url: string | null;
  status: "live" | "review" | "off";
  auth_type: string | null;
  bound_prompts: string[];
  protocol: string | null;
  uptime: number | null;
  last_ping_at: string | null;
  secret: string | null;
  received_today: number | null;
  errors_today: number | null;
  p50_latency_ms: number | null;
  created_at: string | null;
}

export type HookInsert = {
  id: string;
  owner_id: string;
  name: string;
  url_token: string;
  status?: "live" | "review" | "off";
  auth_type?: string | null;
  bound_prompts?: string[];
}

export type IntakeEventRow = {
  id: string;
  owner_id: string;
  source: "hook" | "manual";
  hook_id: string | null;
  prompt_id: string | null;
  prompt_name: string | null;
  title: string | null;
  campaign_id: string | null;
  campaign_matched: string | null;
  platform: "NAVER_BLOG" | "NAVER_CAFE" | null;
  parse_status: "ok" | "warn" | "error" | null;
  warnings: string[];
  queued: boolean | null;
  latency_ms: number | null;
  raw_hash: string | null;
  raw_body: string | null;
  at: string | null;
}

export type IntakeEventInsert = {
  id: string;
  owner_id: string;
  source: "hook" | "manual";
  hook_id?: string | null;
  prompt_id?: string | null;
  prompt_name?: string | null;
  title?: string | null;
  campaign_id?: string | null;
  campaign_matched?: string | null;
  platform?: "NAVER_BLOG" | "NAVER_CAFE" | null;
  parse_status?: "ok" | "warn" | "error" | null;
  warnings?: string[];
  queued?: boolean | null;
  latency_ms?: number | null;
  raw_hash?: string | null;
  raw_body?: string | null;
  at?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────
// Database 합성 — supabase-js 가 기대하는 표준 형식
// ─────────────────────────────────────────────────────────────────────────

export type ImportRow = {
  id: string;
  owner_id: string;
  at: string | null;
  source: "hook" | "manual";
  source_name: string;
  count: number;
  parsed: number;
  status: "applied" | "partial" | "rejected";
  summary: string | null;
  campaign_id: string | null;
};
export type ImportInsert = ImportRow;

interface Relationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

export interface Database {
  public: {
    Tables: {
      variant_presets: {
        Row: VariantPresetRow;
        Insert: VariantPresetRow;
        Update: Partial<VariantPresetRow>;
        Relationships: Relationship[];
      };
      campaigns: {
        Row: CampaignRow;
        Insert: CampaignInsert;
        Update: Partial<CampaignInsert>;
        Relationships: Relationship[];
      };
      campaign_variants: {
        Row: CampaignVariantRow;
        Insert: CampaignVariantRow;
        Update: Partial<CampaignVariantRow>;
        Relationships: Relationship[];
      };
      posts: {
        Row: PostRow;
        Insert: PostInsert;
        Update: PostUpdate;
        Relationships: Relationship[];
      };
      prompts: {
        Row: PromptRow;
        Insert: PromptInsert;
        Update: Partial<PromptInsert>;
        Relationships: Relationship[];
      };
      templates: {
        Row: TemplateRow;
        Insert: TemplateRow;
        Update: Partial<TemplateRow>;
        Relationships: Relationship[];
      };
      hooks: {
        Row: HookRow;
        Insert: HookInsert;
        Update: Partial<HookInsert>;
        Relationships: Relationship[];
      };
      intake_events: {
        Row: IntakeEventRow;
        Insert: IntakeEventInsert;
        Update: Partial<IntakeEventInsert>;
        Relationships: Relationship[];
      };
      imports: {
        Row: ImportRow;
        Insert: ImportInsert;
        Update: Partial<ImportInsert>;
        Relationships: Relationship[];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
