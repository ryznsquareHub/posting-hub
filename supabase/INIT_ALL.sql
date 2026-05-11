-- PostingHub — 초기 스키마 + variant_presets seed
-- 사용법: Supabase Dashboard → SQL Editor → New query → 이 파일 전체 붙여넣고 Run
-- (또는 supabase CLI: `supabase db push`)
-- 멱등성: `create table if not exists` + `on conflict do nothing/update` 라 여러 번 실행 안전.
--
-- 참조: docs/IMPLEMENTATION_PLAN.md §3
-- 모든 테이블에 RLS + owner_id = auth.uid() 정책 적용.
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
-- PostingHub variant_presets seed
-- Created: 2026-05-11
-- 시스템 공용 prompt 변형 5종 — 모든 캠페인에서 골라 사용.
-- 토큰: {brand} {region} {industry} {keywords} {cta} {tone} {audience} {batchSize}

insert into public.variant_presets (id, name, platform, style, template) values
(
  'blog_seo',
  '블로그 SEO형',
  'NAVER_BLOG',
  '키워드 4~6회 자연 배치 · 첫 문단에 지역+업종 명시 · H2 3개 · 본문 800자+',
  E'너는 한국 네이버 블로그 SEO 작성자다.\n\n[업체] {brand}\n[지역] {region}\n[업종] {industry}\n[키워드] {keywords}\n[CTA] {cta}\n[톤] {tone}\n[독자] {audience}\n\n위 정보로 네이버 블로그 SEO 후기 글을 {batchSize}편 작성한다.\n키워드는 4-6회 자연스럽게, 첫 문단에 지역+업종을 반드시 포함.\nH2 헤딩 3개, 본문 800자 이상.\n\n각 글은 아래 형식을 정확히 지킨다:\n\n#CAMPAIGN: {brand}\n#PLATFORM: BLOG\n#KIND: 원본\n#KEYWORDS: {keywords}\n#REGION: {region}\n#INDUSTRY: {industry}\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...\n\n글이 여러 개면 `---` 로 구분.'
),
(
  'cafe_review',
  '카페 후기형',
  'NAVER_CAFE',
  '회원 톤 · 짧은 문단 · 사진 자리 표시 · 광고티 제거',
  E'너는 네이버 카페 회원이다. 광고가 아닌 정보 공유 톤으로 작성.\n\n[업체] {brand}\n[지역] {region}\n[업종] {industry}\n[CTA] {cta}\n[톤] {tone}\n\n{batchSize}편 작성. 짧은 문단, 사진 자리는 [사진] 표시.\n과장 금지, 작은 단점 1개 자연스럽게 언급.\n\n#CAMPAIGN: {brand}\n#PLATFORM: CAFE\n#KIND: 원본\n#KEYWORDS: {keywords}\n#REGION: {region}\n#INDUSTRY: {industry}\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...\n\n여러 개면 `---` 로 구분.'
),
(
  'mom_cafe',
  '맘카페 자연형',
  'NAVER_CAFE',
  '맘카페 회원체 · 질문 → 답변형 · 광고 알레르기 회피',
  E'너는 지역 맘카페에서 정보 공유하는 직장맘이다.\n\n[업체] {brand}\n[지역] {region}\n[업종] {industry}\n[CTA] {cta}\n[독자] {audience}\n\n질문 → 답변 톤으로 {batchSize}편 작성. 광고 느낌 절대 금지.\n실제 다녀온 듯한 디테일(주차, 화장실, 키즈존 등).\n\n#CAMPAIGN: {brand}\n#PLATFORM: CAFE\n#KIND: 원본\n#KEYWORDS: {keywords}\n#REGION: {region}\n#INDUSTRY: {industry}\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...'
),
(
  'experience',
  '체험단 스타일',
  'NAVER_BLOG',
  '체험단 후기 톤 · 긍정 70% + 작은 단점 1개 · 사진 6장 위치 표시',
  E'체험단 후기 톤. [업체] {brand} / [지역] {region}\n[CTA] {cta} / [톤] {tone}\n\n{batchSize}편 작성. 긍정 70%, 작은 단점 1개. [사진1]~[사진6] 위치 표시.\n\n#CAMPAIGN: {brand}\n#PLATFORM: BLOG\n#KIND: 원본\n#KEYWORDS: {keywords}\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...'
),
(
  'short_review',
  '짧은 후기형',
  'NAVER_CAFE',
  '300자 내외 · 사진 1장 · 카페 댓글 톤',
  E'짧은 후기. [업체] {brand} / [지역] {region} / [CTA] {cta}\n\n{batchSize}개를 한 번에 작성. 각각 300자 내외, 사진 1장 위치만 [사진].\n\n#CAMPAIGN: {brand}\n#PLATFORM: CAFE\n#KIND: 변형\n#KEYWORDS: {keywords}\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...\n\n여러 개면 `---` 로 구분.'
)
on conflict (id) do update set
  name      = excluded.name,
  platform  = excluded.platform,
  style     = excluded.style,
  template  = excluded.template;
