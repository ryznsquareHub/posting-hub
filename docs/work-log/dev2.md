# work-log / DEV2

> DEV2 단독 owner. [START] / [DONE] / [BLOCKED] append-only.
> 형식: `docs/roles/dev2.md §2`.

---

## 2026-05-11 — [DONE T-101~T-108] (Phase 2)

- DB 변경 유무: yes (migrations 0001 + 0002 신규)
- 변경 파일:
  - supabase/config.toml (신규)
  - supabase/migrations/0001_init.sql (refactor — variant_presets seed 분리)
  - supabase/migrations/0002_seed_variant_presets.sql (신규)
  - supabase/functions/_shared/cors.ts (신규)
  - supabase/functions/_shared/parser.ts (신규 — Claude 구조화 출력 파서)
  - supabase/functions/hook-intake/index.ts (실제 구현)
  - src/lib/supabase/{client,types,mappers}.ts (신규)
  - src/lib/api/{campaigns,posts,prompts,intake,hooks}.ts (신규 + zod 검증)
  - src/lib/auth/{AuthProvider,RequireAuth}.tsx (신규 — Magic Link)
  - src/features/{posts/usePosts,campaigns/useCampaigns,prompts/usePrompts,intake/useIntake}.ts (신규)
  - src/app/{login,auth-callback}.tsx (신규)
  - src/app/dashboard/settings.tsx (sign-out + 환경변수 / Hook 표시)
  - src/App.tsx (login / auth-callback / RequireAuth gate)
  - src/main.tsx (AuthProvider 래핑)
  - src/components/layout/Sidebar.tsx (실제 user 표시)
  - package.json (supabase-js, zod 추가 + npm scripts)
  - .env.example, docs/OPS.md 갱신
- tsc/lint/build: ✅ (build 583KB / gzip 170KB)
- 인증 가드: ✅ (RequireAuth + Edge Function Bearer/url-token + RLS owner_id=auth.uid())
- 멱등성: ✅ (intake_events UNIQUE(owner_id, raw_hash))
- DB 마이그레이션:
  - 적용: `npx supabase db reset` (로컬) / `supabase db push` (원격)
  - 롤백: 마이그레이션은 추가만 — `drop table` 미작성. 필요 시 0003_rollback.sql 작성.
- 메모:
  - 환경변수 미설정 시 mock fallback (D-005) — seed.ts 그대로 동작.
  - 사용자 provisioning 대기 항목: docs/TASK_BOARD.md W-001.
  - interface→type 변환 (D-006) — supabase-js generic 호환.
