-- PostingHub initial schema
-- Created: 2026-05-11
-- 참조: docs/IMPLEMENTATION_PLAN.md §3
--
-- 모든 테이블에 RLS + owner_id = auth.uid() 정책.
-- variant_presets 만 public read.

-- ─────────────────────────────────────────────────────────────────────────
-- variant_presets (system-wide, public read)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.variant_presets (
  id        text primary key,
  name      text not null,
  platform  text not null check (platform in ('NAVER_BLOG','NAVER_CAFE')),
  style     text,
  template  text not null,
  created_at timestamptz default now()
);
alter table public.variant_presets enable row level security;
create policy "variant_presets_public_read"
  on public.variant_presets for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────
-- campaigns
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.campaigns (
  id            text primary key,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  region        text,
  industry      text,
  color         text,
  client_note   text,
  brand         text,
  platforms     text[] not null default '{}',
  cta           text,
  tone          text,
  audience      text,
  keywords      text[] not null default '{}',
  active_variant_id text references public.variant_presets(id) on delete set null,
  started_at    date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.campaigns enable row level security;
create policy "campaigns_owner_select" on public.campaigns
  for select using (auth.uid() = owner_id);
create policy "campaigns_owner_modify" on public.campaigns
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists idx_campaigns_owner on public.campaigns(owner_id);

-- ─────────────────────────────────────────────────────────────────────────
-- campaign_variants (M:N campaigns ↔ variant_presets)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.campaign_variants (
  campaign_id text not null references public.campaigns(id) on delete cascade,
  variant_id  text not null references public.variant_presets(id) on delete cascade,
  primary key (campaign_id, variant_id)
);
alter table public.campaign_variants enable row level security;
create policy "campaign_variants_owner_select" on public.campaign_variants
  for select using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_variants.campaign_id and c.owner_id = auth.uid()
    )
  );
create policy "campaign_variants_owner_modify" on public.campaign_variants
  for all using (
    exists (
      select 1 from public.campaigns c
      where c.id = campaign_variants.campaign_id and c.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- posts
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id            text primary key,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  campaign_id   text references public.campaigns(id) on delete set null,
  title         text not null,
  body          text not null,
  platform      text not null check (platform in ('NAVER_BLOG','NAVER_CAFE')),
  kind          text not null default 'original' check (kind in ('original','variant','recycled')),
  keywords      text[] not null default '{}',
  region        text,
  industry      text,
  cta           text,
  memo          text,
  status        text not null default 'ready' check (status in ('draft','ready','scheduled','published','archived')),
  copy_count    int not null default 0,
  recyclable    boolean not null default false,
  scheduled_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.posts enable row level security;
create policy "posts_owner_select" on public.posts
  for select using (auth.uid() = owner_id);
create policy "posts_owner_modify" on public.posts
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists idx_posts_owner_campaign on public.posts(owner_id, campaign_id);
create index if not exists idx_posts_owner_status on public.posts(owner_id, status);
create index if not exists idx_posts_owner_scheduled on public.posts(owner_id, scheduled_at);

-- ─────────────────────────────────────────────────────────────────────────
-- prompts (user-authored library)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id            text primary key,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  category      text,
  platform      text check (platform in ('NAVER_BLOG','NAVER_CAFE')),
  description   text,
  variables     text[] not null default '{}',
  output_format text,
  body          text not null,
  webhook_enabled boolean default false,
  auto_parse    boolean default true,
  schedule      text,
  uses          int default 0,
  last_run_at   timestamptz,
  last_run_status text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.prompts enable row level security;
create policy "prompts_owner_select" on public.prompts
  for select using (auth.uid() = owner_id);
create policy "prompts_owner_modify" on public.prompts
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────
-- templates
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.templates (
  id         text primary key,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  platform   text check (platform in ('NAVER_BLOG','NAVER_CAFE')),
  name       text not null,
  uses       int default 0,
  updated_at timestamptz default now()
);
alter table public.templates enable row level security;
create policy "templates_owner_select" on public.templates
  for select using (auth.uid() = owner_id);
create policy "templates_owner_modify" on public.templates
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────
-- hooks (webhook endpoints)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.hooks (
  id            text primary key,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  url_token     text not null unique,
  status        text default 'live' check (status in ('live','review','off')),
  auth_type     text default 'Bearer',
  bound_prompts text[] default '{}',
  created_at    timestamptz default now()
);
alter table public.hooks enable row level security;
create policy "hooks_owner_select" on public.hooks
  for select using (auth.uid() = owner_id);
create policy "hooks_owner_modify" on public.hooks
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────────────────
-- intake_events
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.intake_events (
  id              text primary key,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  source          text not null check (source in ('hook','manual')),
  hook_id         text references public.hooks(id) on delete set null,
  prompt_id       text references public.prompts(id) on delete set null,
  prompt_name     text,
  title           text,
  campaign_id     text references public.campaigns(id) on delete set null,
  campaign_matched text,
  platform        text check (platform in ('NAVER_BLOG','NAVER_CAFE')),
  parse_status    text check (parse_status in ('ok','warn','error')),
  warnings        text[] default '{}',
  queued          boolean default false,
  latency_ms      int,
  raw_hash        text,
  raw_body        text,
  at              timestamptz default now(),
  constraint intake_events_idempotent unique (owner_id, raw_hash)
);
alter table public.intake_events enable row level security;
create policy "intake_events_owner_select" on public.intake_events
  for select using (auth.uid() = owner_id);
create policy "intake_events_owner_modify" on public.intake_events
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create index if not exists idx_intake_owner_at on public.intake_events(owner_id, at desc);

-- (variant_presets seed 은 별도 마이그레이션 0002 에서 처리)
-- 본 파일은 schema + RLS 만 담당.
