# PostingHub — 구현 계획 (SSOT)

> 작성: 2026-05-11 · 기반 자료: `.design-package/postinghub/` (Claude Design 핸드오프 번들)
> 디자인 의도: "예쁜 SaaS" 아니라 **하루 종일 쓰는 고속 운영툴**. Linear/Vercel 풍 다크.
> 핵심 흐름: PostingHub → 사용자 → Claude (Prompt 복사), Claude → Hook → PostingHub (결과 저장).
> 단위: **Campaign** (잠실 키즈카페 등) > Posts (Blog/Cafe/변형/예약/재활용).

---

## 1. 최종 폴더 구조

```
PostingHub/
├── public/                              # static assets
├── src/
│   ├── main.tsx                         # entrypoint (React 18 createRoot)
│   ├── App.tsx                          # router root (createBrowserRouter)
│   ├── styles/
│   │   ├── tokens.css                   # CSS variables (Linear/Vercel dark)
│   │   └── globals.css                  # base + scrollbar + selection
│   ├── app/                             # ROUTES (route 단위 조립만)
│   │   ├── root-redirect.tsx            # / → /dashboard
│   │   ├── not-found.tsx
│   │   └── dashboard/
│   │       ├── layout.tsx               # DashboardLayout (sidebar + topbar + outlet)
│   │       ├── today.tsx                # /dashboard
│   │       ├── posts.tsx                # /dashboard/posts
│   │       ├── campaign-detail.tsx      # /dashboard/campaign/:id
│   │       ├── templates.tsx            # /dashboard/templates
│   │       ├── prompt-library.tsx       # /dashboard/prompt-library
│   │       ├── intake.tsx               # /dashboard/import (Inbox)
│   │       ├── history.tsx              # /dashboard/history
│   │       └── settings.tsx             # /dashboard/settings
│   ├── components/                      # 공용 UI (route 비종속)
│   │   ├── ui/                          # Button, Badge, Input, Toast 등 primitive
│   │   ├── layout/                      # Sidebar, Topbar, StatusBar, HelpOverlay, CmdPalette
│   │   └── icons.tsx                    # lucide wrapper (디자인 icons.jsx 대응)
│   ├── features/                        # 도메인 feature (route + lib 다리)
│   │   ├── posts/
│   │   │   ├── PostsList.tsx            # row 테이블 + head
│   │   │   ├── PostRow.tsx
│   │   │   ├── PostCard.tsx             # cards layout
│   │   │   ├── PreviewPanel.tsx         # 우측 460px split 패널
│   │   │   ├── FiltersBar.tsx           # 상태 탭 + Blog/Cafe + 검색
│   │   │   ├── CopyModal.tsx
│   │   │   ├── scoped-search.ts         # platform: status: kind: kw: region:
│   │   │   ├── status-meta.ts
│   │   │   └── usePosts.ts              # React Query hook (Phase 2)
│   │   ├── campaigns/
│   │   │   ├── CampaignHeader.tsx
│   │   │   ├── PromptBuilder.tsx        # variant + settings → 최종 prompt 합성
│   │   │   ├── PromptCopyCard.tsx       # 거대한 [복사] CTA
│   │   │   ├── VariantTabs.tsx
│   │   │   ├── HookStatusBadge.tsx      # 보조 정보 (메인 X)
│   │   │   └── useCampaigns.ts
│   │   ├── prompts/
│   │   │   ├── PromptLibraryList.tsx
│   │   │   └── PromptDetail.tsx
│   │   ├── intake/                      # Inbox
│   │   │   ├── IntakeFeed.tsx
│   │   │   ├── ManualPaste.tsx
│   │   │   ├── BatchHistory.tsx
│   │   │   └── HookEndpoints.tsx
│   │   └── templates/TemplateList.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # supabase-js singleton (env에서 URL/anon)
│   │   │   ├── server.ts                # service_role (Edge Function 전용)
│   │   │   └── types.ts                 # Database 자동 생성 타입
│   │   ├── api/
│   │   │   ├── campaigns.ts             # CRUD + fetch
│   │   │   ├── posts.ts
│   │   │   ├── prompts.ts
│   │   │   ├── intake.ts
│   │   │   └── hooks.ts
│   │   ├── keyboard/
│   │   │   ├── useGlobalShortcuts.ts    # J/K, C, 1-5, B, N, D, ?, /, g+letter
│   │   │   └── scopes.ts
│   │   └── format/
│   │       ├── date.ts                  # "11/5 14:30" 단축 포맷
│   │       └── status.ts
│   ├── hooks/
│   │   ├── useHashOrSearch.ts
│   │   └── useToasts.ts                 # sonner wrapper
│   ├── types/
│   │   ├── campaign.ts
│   │   ├── post.ts
│   │   ├── prompt.ts
│   │   └── intake.ts
│   └── data/
│       └── seed.ts                      # mock data (Phase 1; Phase 2에 Supabase로 이관)
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 0001_init.sql                # campaigns, posts, prompts, hooks, intake_events
│   └── functions/
│       └── hook-intake/index.ts         # 외부 Claude → POST /hook-intake
├── docs/                                # 협업 SSOT
│   ├── IMPLEMENTATION_PLAN.md           # 이 파일
│   ├── TASK_BOARD.md
│   ├── DECISIONS.md
│   ├── QA_REPORT.md
│   ├── INBOX.md
│   ├── HANDOFF.md
│   ├── roles/{intake,pm,dev1,dev2,qa}.md
│   └── work-log/{dev1,dev2,qa}.md
├── .claude/
│   ├── agents/{intake,dev1,dev2,qa}.md
│   ├── hooks/role-handoff.js
│   └── settings.local.json
├── scripts/
│   └── pull-doppler.ts                  # Doppler → .env.local 동기화 (개발용)
├── CLAUDE.md                            # 협업 룰북 (SSOT)
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── index.html
```

---

## 2. 라우팅 구조 (React Router `createBrowserRouter`)

```
/                                  → redirect to /dashboard
/dashboard                         → Today (DashboardLayout > today.tsx)
/dashboard/posts                   → posts.tsx (PostsList + PreviewPanel)
/dashboard/campaign/:id            → campaign-detail.tsx
/dashboard/templates               → templates.tsx
/dashboard/prompt-library          → prompt-library.tsx
/dashboard/import                  → intake.tsx  (Inbox — Claude 결과 도착)
/dashboard/history                 → history.tsx
/dashboard/settings                → settings.tsx
*                                  → not-found.tsx
```

DashboardLayout 책임:
- Sidebar (Recent Campaigns / Quick Filters / Automation)
- Topbar (breadcrumb / Cmd+K / New)
- StatusBar (posts·campaign 라우트만)
- CmdPalette (전역)
- HelpOverlay (전역, `?` 토글)
- Toast container (sonner)

---

## 3. DB 테이블 구조 (Supabase / Postgres)

```sql
-- 0001_init.sql 요지

create table campaigns (
  id            text primary key,                 -- 'c_jamsil_kids' 같은 slug
  owner_id      uuid references auth.users(id),
  name          text not null,
  region        text,
  industry      text,
  color         text,                              -- '#f5a524'
  client_note   text,
  brand         text,
  platforms     text[] not null default '{}',     -- ['NAVER_BLOG','NAVER_CAFE']
  cta           text,
  tone          text,
  audience      text,
  keywords      text[] not null default '{}',
  active_variant_id text,
  started_at    date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table variant_presets (                      -- 시스템 공용 (read-only)
  id        text primary key,                       -- 'blog_seo','cafe_review' 등
  name      text not null,
  platform  text not null,
  style     text,
  template  text not null                            -- {brand},{region}... 토큰 포함
);

create table campaign_variants (                    -- 캠페인이 사용 중인 variant
  campaign_id text references campaigns(id) on delete cascade,
  variant_id  text references variant_presets(id),
  primary key (campaign_id, variant_id)
);

create table posts (
  id            text primary key,                   -- 'p_001' 또는 nanoid
  owner_id      uuid references auth.users(id),
  campaign_id   text references campaigns(id) on delete cascade,
  title         text not null,
  body          text not null,
  platform      text not null,                       -- 'NAVER_BLOG' | 'NAVER_CAFE'
  kind          text not null default 'original',    -- 'original'|'variant'|'recycled'
  keywords      text[] not null default '{}',
  region        text,
  industry      text,
  cta           text,
  memo          text,
  status        text not null default 'ready',       -- draft|ready|scheduled|published|archived
  copy_count    int  not null default 0,
  recyclable    boolean not null default false,
  scheduled_at  timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table prompts (                              -- Prompt Library (사용자 작성)
  id            text primary key,
  owner_id      uuid references auth.users(id),
  name          text not null,
  category      text,
  platform      text,
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

create table templates (                            -- Post templates (별도)
  id         text primary key,
  owner_id   uuid references auth.users(id),
  platform   text,
  name       text not null,
  uses       int default 0,
  updated_at timestamptz default now()
);

create table hooks (                                -- Webhook 엔드포인트
  id            text primary key,
  owner_id      uuid references auth.users(id),
  name          text not null,
  url_token     text not null unique,                -- /hook-intake?t=<token>
  status        text default 'live',                  -- live|review|off
  auth_type     text default 'Bearer',
  bound_prompts text[] default '{}',
  created_at    timestamptz default now()
);

create table intake_events (                        -- Hook 또는 Manual paste 도착 기록
  id              text primary key,
  owner_id        uuid references auth.users(id),
  source          text not null,                      -- 'hook'|'manual'
  hook_id         text references hooks(id),
  prompt_id       text references prompts(id),
  prompt_name     text,
  title           text,
  campaign_id     text references campaigns(id),
  campaign_matched text,
  platform        text,
  parse_status    text,                                -- ok|warn|error
  warnings        text[] default '{}',
  queued          boolean default false,
  latency_ms      int,
  raw_body        text,
  at              timestamptz default now()
);

-- RLS: 모든 테이블 owner_id = auth.uid() 정책
-- variant_presets 만 read-public.
```

자세한 인덱스/RLS 정책은 `supabase/migrations/0001_init.sql` 에서 작성 (Phase 2).

---

## 4. 구현 순서 (Phase 1 ~ 4)

### Phase 1 — 운영 가능한 mock UI (Supabase 연동 전)
1. Vite + React 18 + TypeScript + Tailwind + React Router 스캐폴드
2. CSS 토큰 (styles.css → tokens.css 이식)
3. DashboardLayout (Sidebar + Topbar + StatusBar)
4. **/dashboard/posts** — 8컬럼 grid row + split PreviewPanel + 필터바 + 키보드 (J/K/C/1-5/B/N/D/?)
5. **/dashboard** — Today: stat cards + 운영 큐 4칸 + 캠페인별 큐 그리드
6. **/dashboard/campaign/:id** — CampaignHeader + Variant 탭 + Prompt 합성 + **거대한 [복사] CTA** + 캠페인 글 목록
7. /dashboard/templates, /prompt-library, /import (Inbox), /settings — placeholder + 핵심 인터랙션
8. sonner toast, mock data (`src/data/seed.ts`)
9. 모바일 (375) / 태블릿 (768) / 데스크톱 (1280) 반응형

### Phase 2 — Supabase + Doppler 연동
1. Doppler 프로젝트 생성 (`postinghub` / configs: `dev`, `stg`, `prd`)
2. Supabase 프로젝트 생성 + URL/anon/service_role 키 → Doppler secrets
3. `0001_init.sql` 마이그레이션 적용 + variant_presets seed
4. RLS 정책 + 인덱스
5. `lib/supabase/client.ts` (anon, 클라이언트), `server.ts` (Edge Function 전용)
6. React Query 도입 (`@tanstack/react-query`)
7. `lib/api/*.ts` → mock 대체
8. Auth (Supabase Auth — magic link 또는 이메일/비번)
9. `supabase/functions/hook-intake/index.ts` — Claude → Hook 콜백 수신, parse, intake_events insert

### Phase 3 — UX 강화 + polish
1. 복사 UX: 1-click + auto status transition + row flash + sessionCopies 카운터
2. scoped 검색 (`platform:`, `status:`, `kind:`, `kw:`, `region:`) 완성
3. Burst 모드 (C 누르면 다음 ready 행 자동 이동)
4. Cmd+K palette, HelpOverlay (`?`)
5. Loading skeleton / Empty state / Error boundary
6. 모바일 반응형 모든 페이지

### Phase 4 — Prompt Library + Claude Scheduled Tasks 통합 + 운영 문서
1. Prompt Library 페이지 — 카테고리별 좌측 + 우측 detail
2. Claude Scheduled Tasks 가 호출할 Prompt 데이터 구조 정리
3. `README.md` + `.env.example` + `docs/OPS.md` (배포 / 환경 / Doppler / Supabase 운영 가이드)
4. Vercel 또는 Cloudflare Pages 배포 가이드

---

## 5. 생성/수정할 파일 목록 (Phase 1 기준 우선)

### 루트 설정
- `package.json` · `tsconfig.json` · `vite.config.ts` · `tailwind.config.ts` · `postcss.config.js` · `index.html` · `.env.example` · `.gitignore` · `README.md`

### 협업 인프라
- `CLAUDE.md` · `docs/IMPLEMENTATION_PLAN.md` (이 파일)
- `docs/TASK_BOARD.md` · `docs/DECISIONS.md` · `docs/QA_REPORT.md` · `docs/INBOX.md` · `docs/HANDOFF.md`
- `docs/roles/{intake,pm,dev1,dev2,qa}.md`
- `docs/work-log/{dev1,dev2,qa}.md`
- `.claude/agents/{intake,dev1,dev2,qa}.md`
- `.claude/hooks/role-handoff.js`
- `.claude/settings.local.json`

### 앱 코드 (Phase 1)
- `src/main.tsx` · `src/App.tsx`
- `src/styles/tokens.css` · `src/styles/globals.css`
- `src/data/seed.ts`
- `src/types/{campaign,post,prompt,intake}.ts`
- `src/app/root-redirect.tsx` · `src/app/not-found.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/dashboard/{today,posts,campaign-detail,templates,prompt-library,intake,history,settings}.tsx`
- `src/components/icons.tsx` · `src/components/ui/{Button,Badge,Input,Kbd,Toast}.tsx`
- `src/components/layout/{Sidebar,Topbar,StatusBar,HelpOverlay,CmdPalette}.tsx`
- `src/features/posts/{PostsList,PostRow,PostCard,PreviewPanel,FiltersBar,CopyModal,scoped-search,status-meta}.{ts,tsx}`
- `src/features/campaigns/{CampaignHeader,PromptBuilder,PromptCopyCard,VariantTabs,HookStatusBadge}.tsx`
- `src/features/prompts/{PromptLibraryList,PromptDetail}.tsx`
- `src/features/intake/{IntakeFeed,ManualPaste,BatchHistory,HookEndpoints}.tsx`
- `src/features/templates/TemplateList.tsx`
- `src/lib/keyboard/{useGlobalShortcuts,scopes}.ts`
- `src/lib/format/{date,status}.ts`
- `src/hooks/{useToasts}.ts`

### Phase 2~4
- `src/lib/supabase/{client,server,types}.ts`
- `src/lib/api/{campaigns,posts,prompts,intake,hooks}.ts`
- `supabase/migrations/0001_init.sql`
- `supabase/functions/hook-intake/index.ts`
- `scripts/pull-doppler.ts`
- `docs/OPS.md`

---

## 6. 디자인 결정 (이 프로젝트 한정)

- **타이포**: Geist (sans) + Geist Mono — Google Fonts 동일 사용.
- **테마**: 다크만 (사용자 명시). 라이트는 Phase 4 이후 옵션.
- **density**: compact 기본 (row 36px). comfy 토글 (52px).
- **반응형 breakpoints**: 모바일 375 / 태블릿 768 / 데스크톱 1280. 1100px 미만에선 split layout → 모바일 모드 자동 전환.
- **상태 색**: amber(ready) / blue(scheduled) / green(published) / gray(draft) / dark-gray(archived).
- **inline style 금지 / Tailwind 토큰 / shadcn 패턴 (full shadcn 도입 X, primitive 만)**.

---

## 7. 이번 턴 deliverable

- [x] 이 IMPLEMENTATION_PLAN.md 작성
- [ ] CLAUDE.md + 역할 인프라 (intake/pm/dev1/dev2/qa) 전부
- [ ] Vite/React/TS 스캐폴드 + Tailwind + 토큰 + Router
- [ ] DashboardLayout + Sidebar + Topbar 골격
- [ ] /dashboard/posts 최소 동작 (목록 + row + 키보드 J/K/C)
- [ ] mock seed 데이터

다음 턴부터 Phase 1 잔여 페이지 + Phase 2 (Supabase + Doppler) 순차 진행.
