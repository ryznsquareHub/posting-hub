-- PostingHub — schema 보강 (Phase 2-b)
-- prompts, hooks 에 운영 stats 컬럼 추가 + imports (batch 이력) 테이블 신규.

-- ── prompts: 실행 통계 ──────────────────────────────────────────────────
alter table public.prompts
  add column if not exists last_run_count int,
  add column if not exists success_rate numeric;

-- ── hooks: 운영 stats / 메타 ────────────────────────────────────────────
alter table public.hooks
  add column if not exists url text,           -- 사용자 노출용 URL (url_token 과 별개)
  add column if not exists protocol text,
  add column if not exists uptime numeric,
  add column if not exists last_ping_at timestamptz,
  add column if not exists secret text,
  add column if not exists received_today int default 0,
  add column if not exists errors_today int default 0,
  add column if not exists p50_latency_ms int default 0;

-- ── imports: batch 이력 (별도 테이블) ──────────────────────────────────
create table if not exists public.imports (
  id          text primary key,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  at          timestamptz default now(),
  source      text not null check (source in ('hook','manual')),
  source_name text not null,
  count       int not null default 0,
  parsed      int not null default 0,
  status      text not null check (status in ('applied','partial','rejected')),
  summary     text default '',
  campaign_id text references public.campaigns(id) on delete set null
);
alter table public.imports enable row level security;

-- 중복 정책 방지
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='imports' and policyname='imports_owner_select') then
    create policy "imports_owner_select" on public.imports for select using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='imports' and policyname='imports_owner_modify') then
    create policy "imports_owner_modify" on public.imports for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
  end if;
end $$;

create index if not exists idx_imports_owner_at on public.imports(owner_id, at desc);
