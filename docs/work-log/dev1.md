# work-log / DEV1

> DEV1 단독 owner. [START] / [DONE] / [BLOCKED] append-only.
> 형식: `docs/roles/dev1.md §2`.

---

## 2026-05-11 — [DONE T-201~T-206] (Phase 1.5 — 디자인 픽셀 매핑)

- 영향 파일:
  - src/styles/design.css (신규, 68KB — 디자인 통째 도입)
  - src/styles/globals.css (refactor — design.css + tailwind utilities only)
  - src/components/icons.tsx (디자인 `I.X` API + External/Link 추가)
  - src/components/layout/{Sidebar,Topbar,StatusBar}.tsx (디자인 className 1:1)
  - src/lib/format/meta.tsx (신규 — PlatTag/LiveDot/StatusPill/timeAgo/statusMeta/kindMeta)
  - src/features/posts/{FiltersBar,PostRow,PostsList,PreviewPanel}.tsx (디자인 9-cell row + filter-tabs + preview-meta-grid)
  - src/features/intake/parseClaudeOutput.ts (신규 — 디자인 parser 1:1 + SAMPLE_IMPORT)
  - src/features/campaigns/PromptBuilder.ts (refactor)
  - src/app/dashboard/{today,templates,prompt-library,intake,campaign-detail,posts,layout}.tsx (디자인 매핑)
  - src/data/seed.ts (AUTOMATION + STATUSES/PLATFORMS/KINDS export 추가)
- tsc/lint/build: ✅ (build 585KB / CSS 57.74KB / gzip 10.72KB)
- dev server: 8 라우트 전부 200 OK
- 시각 확인: 사용자 위임 — http://localhost:5173/dashboard 부터 시작
- 메모:
  - 디자인 패키지의 styles.css 통째 도입 (D-007).
  - 페이지별 핵심 클래스: today-page / tpl-page / wf-page / imp-page / cd-page.
  - 데이터: mock (seed.ts) 그대로 — Phase 2 hook 은 isSupabaseConfigured 분기.

---

## 2026-05-11 — [DONE T-301~T-305, T-401] (Phase 3 UX polish + Phase 4 docs)

- 영향 파일:
  - src/components/layout/CmdPalette.tsx (신규 — 디자인 shell.jsx CmdPalette 1:1)
  - src/components/layout/HelpOverlay.tsx (refactor — help-overlay / help-card / help-table 4 group, 디자인 quickops.jsx 매칭)
  - src/lib/keyboard/matchesScoped.ts (신규 — platform/status/region/industry/kw/memo 토큰 + 일반어 AND)
  - src/app/dashboard/layout.tsx (cmdOpen state + ⌘K 핸들러 + CmdPalette render + matchesScoped 적용 + QuickFilter import)
  - src/app/dashboard/history.tsx (refactor — 복사/발행/예약 이력 시간순)
  - src/app/dashboard/settings.tsx (refactor — cd-prompt 패턴 + cd-stats + wf-hook-grid + auto.* status pill)
  - docs/CLAUDE_SCHEDULED_TASKS.md (신규 — Hook 발급 / Claude 등록 / curl 테스트 / 트러블슈팅 / 시크릿 회전)
- tsc/lint/build: ✅ (build 589KB / CSS 55.57KB / gzip 10.18KB)
- 검증: 9 라우트 (`/dashboard/history` 포함) 전부 200
- 메모:
  - matchesScoped 는 quickops.jsx 와 100% 동일 시맨틱.
  - CmdPalette 는 캠페인 동적 목록 포함 — sidebar 의 캠페인 + nav 7개.
  - History 는 mock 모드 — Phase 2 에서는 별도 audit_log 테이블 또는 lastCopiedAt 컬럼 추가 추천.
