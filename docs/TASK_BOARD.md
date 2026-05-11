# TASK_BOARD — PostingHub

> PM 단독 owner. DEV/QA 는 read 만.
> 형식: `docs/roles/pm.md §3` 참조.

---

## 진행 중 (in_progress)

(없음 — Phase 2 코드 완료. 외부 provisioning 사용자 대기)

---

## 사용자 대기 (waiting)

### W-001 — Supabase + Doppler 프로젝트 provisioning
- **담당**: founder (사용자 직접)
- **이유**: CLAUDE.md §9 — production env / 시크릿 작업은 사용자 확인 필수
- **할 일**: `docs/OPS.md §1, §2` 참조
  - [ ] Doppler `postinghub` 프로젝트 생성 + `dev` / `stg` / `prd` configs
  - [ ] Supabase 프로젝트 생성 (또는 `supabase start` 로컬)
  - [ ] `supabase db reset` 으로 0001/0002 마이그레이션 적용
  - [ ] Doppler 에 4개 키 set: VITE_PUBLIC_SUPABASE_URL / VITE_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / HOOK_SHARED_SECRET
  - [ ] `doppler run -- npm run dev` 로 로컬 동작 확인

---

## 대기 (pending)

### T-001 — Phase 1 스캐폴드 (Vite + Tailwind + Router + tokens)
- **담당**: PM (이번 turn 에 PM 이 직접 진행 — 초기 부트스트랩)
- **우선순위**: P0
- **근거**: `docs/IMPLEMENTATION_PLAN.md` Phase 1 1~3
- **영향 파일**: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/styles/{tokens,globals}.css`, `.gitignore`, `.env.example`
- **구현 범위**:
  - Vite 6 + React 18 + TypeScript + SWC 템플릿
  - Tailwind 3 + autoprefixer + 디자인 토큰 CSS variable
  - React Router 6 (createBrowserRouter)
  - Linear/Vercel 다크 토큰 (#08090a 계열 + Geist 폰트)
- **완료 기준**:
  - [ ] `npm install` 성공
  - [ ] `npm run dev` 가 5173 에서 빈 라우터 응답
  - [ ] `npm run build` 통과
- **비목표**: 데이터 페치, 실제 Supabase 연동, 모든 페이지 구현

### T-002 — DashboardLayout + Sidebar + Topbar
- **담당**: DEV1
- **우선순위**: P0
- **근거**: IMPLEMENTATION_PLAN Phase 1 (3)
- **영향 파일**: `src/app/dashboard/layout.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Topbar.tsx`, `src/components/icons.tsx`
- **구현 범위**:
  - 240px 좌 sidebar + 44px 상 topbar + main outlet
  - Sidebar: Brand · Quick Filters · Recent Campaigns · Automation 4 섹션
  - Topbar: breadcrumb + ⌘K 버튼 + New 버튼
  - Active route 시각 표시 (왼쪽 accent bar)
- **완료 기준**:
  - [ ] tsc / lint / build 통과
  - [ ] 모바일 (375) 에서 sidebar 가 자동 collapse
  - [ ] 모든 nav 항목 클릭 시 placeholder 페이지로 이동

### T-003 — /dashboard/posts 메인 화면 (mock data)
- **담당**: DEV1
- **우선순위**: P0
- **근거**: IMPLEMENTATION_PLAN Phase 1 (4) — PostingHub 핵심 화면
- **영향 파일**: `src/app/dashboard/posts.tsx`, `src/features/posts/*.tsx`, `src/data/seed.ts`, `src/lib/keyboard/scopes.ts`, `src/types/post.ts`
- **구현 범위**:
  - 8컬럼 grid row (check / dot / campaign / title / kind / status / copies / time + actions)
  - 우측 460px split PreviewPanel
  - FiltersBar (status 탭 · Blog/Cafe · 검색)
  - 키보드: J/K/C/1-5/B/N/D/?/Esc
  - 1-click 복사 + status auto-transition + row flash 1.4s
  - Empty state
- **완료 기준**:
  - [ ] tsc / lint / build
  - [ ] 모바일에서 PreviewPanel 이 single column 으로 전환
  - [ ] 키보드 단축키 등록이 scopes.ts 한 곳에
  - [ ] HelpOverlay (`?`) 에 모든 단축키 등록

### T-004 ~ T-009 — Phase 1 잔여 페이지
(다음 사이클에 PM 이 detail 작성)
- T-004 /dashboard (Today)
- T-005 /dashboard/campaign/:id (CampaignDetail + PromptBuilder + 거대 [복사] CTA)
- T-006 /dashboard/templates
- T-007 /dashboard/prompt-library
- T-008 /dashboard/import (Inbox)
- T-009 /dashboard/settings

### T-101 ~ — Phase 2 데이터 레이어
(DEV2 영역. 다음 사이클에 PM 이 detail 작성)

---

## 완료 (done)

- T-101 (Phase 2) — Supabase client + types + mappers (DEV2 / 2026-05-11)
- T-102 (Phase 2) — API layer (campaigns / posts / prompts / intake / hooks) + zod 검증
- T-103 (Phase 2) — React Query hooks (mock fallback 패턴: `isSupabaseConfigured` 분기)
- T-104 (Phase 2) — Auth (Magic Link) + RequireAuth gate + login/auth-callback 페이지
- T-105 (Phase 2) — Edge Function `hook-intake` 실제 구현 (Bearer + URL token + parser + 멱등성)
- T-106 (Phase 2) — Supabase 마이그레이션 0001 + 0002 (variant_presets seed)
- T-107 (Phase 2) — `docs/OPS.md` 운영 가이드, `.env.example`, npm scripts (env:pull / supabase:*)
- T-108 (Phase 2) — interface→type 변환 (supabase-js generic constraint 호환)
- T-201 (Phase 1.5) — `/dashboard/posts` 디자인 픽셀 매칭 (Sidebar 4섹션 + 9 cell row + preview panel) — design.css 통째 도입
- T-202 (Phase 1.5) — `/dashboard` Today 디자인 매핑 (today-page / t-stats / t-grid 4 columns / t-cmps)
- T-203 (Phase 1.5) — `/dashboard/templates` 디자인 매핑 (tpl-page / tpl-table)
- T-204 (Phase 1.5) — `/dashboard/prompt-library` (=Workflows) 디자인 매핑 (wf-page / wf-side / wf-strip / wf-flow / wf-body-grid / wf-hook)
- T-205 (Phase 1.5) — `/dashboard/import` 디자인 매핑 (imp-page / intake-strip / 5 tabs: live / paste / hooks / batches / format)
- T-206 (Phase 1.5) — `/dashboard/campaign/:id` 디자인 매핑 (cd-page / cd-head / cd-stats / cd-prompt-card / cd-inbox / cd-posts + CampaignSettingsEditor)
- T-301 (Phase 3) — Cmd+K palette 실 구현 (CmdPalette + ⌘K toggle + 캠페인 8개 + 모든 페이지 jump)
- T-302 (Phase 3) — HelpOverlay 디자인 매칭 (help-overlay / help-card / help-table 4 group)
- T-303 (Phase 3) — scoped search 정밀화 (matchesScoped 1:1 — platform/status/region/industry/kw/memo + 일반어 AND)
- T-304 (Phase 3) — History 페이지 실 콘텐츠 (복사 + 발행/예약 이력 시간순)
- T-305 (Phase 3) — Settings 페이지 디자인 톤 (cd-prompt 패턴 + cd-stats + wf-hook-grid)
- T-401 (Phase 4) — `docs/CLAUDE_SCHEDULED_TASKS.md` 운영 가이드 (Hook 발급 / Claude 등록 / curl 테스트 / 시크릿 회전 / 트러블슈팅)
- T-501 (D-008) — Single-user 자동 sign-in. founder user 에 admin API 로 비번 set, `VITE_PUBLIC_AUTO_SIGNIN_*` env 추가, `AuthProvider` 가 mount 시 자동 `signInWithPassword`. session 있으면 그대로 통과. `/login` 라우트 보존 (팀 모드 toggle 대비).
