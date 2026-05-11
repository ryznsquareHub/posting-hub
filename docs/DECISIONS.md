# DECISIONS — PostingHub

> PM 단독 owner. 추가만, 수정/삭제 금지. 형식: `docs/roles/pm.md §4` 참조.

---

### D-001 — 스택 결정 (Vite + React + TypeScript + React Router + Supabase + Doppler)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-001
- **결정**:
  - Frontend: Vite 6 + React 18 + TypeScript + Tailwind 3 + React Router 6
  - Data: Supabase (Postgres + Auth + Edge Functions) + `@tanstack/react-query`
  - Secrets: Doppler (`postinghub` 프로젝트, configs: `dev`/`stg`/`prd`)
  - Toast: `sonner`
  - Icons: `lucide-react`
- **배경**:
  - PostingHub 는 운영자가 하루 종일 사용하는 도구 — SSR 필요성 낮음, SPA 충분.
  - Next.js 의 RSC / Server Action 오버헤드 불필요.
  - Vite 의 빠른 HMR 이 키보드 친화 UX 개발에 유리.
  - Supabase + Doppler 는 founder 가 명시 (이번 사이클 user 메시지).
- **비목표**: SSR / SEO 최적화 — 운영자 도구라 검색 노출 무관.
- **검증**: `npm run dev` HMR < 200ms, 빌드 size < 1MB gzip, Supabase 연결 가능.

### D-002 — 영역 매트릭스 (DEV1: UI/Feature · DEV2: Data/Infra)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-002 ~
- **결정**:
  - DEV1: `src/app/**`, `src/components/**`, `src/features/**/*.tsx`, `src/hooks/**`, `src/lib/keyboard/**`, `src/lib/format/**`, `src/styles/**`, `src/data/**`, `src/types/**`, `index.html`
  - DEV2: `src/lib/supabase/**`, `src/lib/api/**`, `src/features/**/use*.ts` (데이터 hook), `supabase/**`, `scripts/**`, `.env.example`
  - PM: 공용 config (`package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`), 협업 문서.
- **배경**: perfoAds 의 "marketing vs ops" 분할이 PostingHub 에 안 맞음 — 운영툴 단일 흐름이라 "UI vs 데이터" 가 더 자연스러움.
- **비목표**: feature 단위 vertical 분할 — 한 feature 안에서 UI/데이터 둘 다 만지면 도리어 충돌.
- **검증**: 두 DEV 가 영역 매트릭스만 보고 한 turn 안에 충돌 없이 작업 가능.

### D-003 — 다크 테마 only (Phase 1~3)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-001
- **결정**: 라이트 테마 미지원. 다크 토큰 `#08090a` 계열 + Geist 폰트 고정.
- **배경**: 디자인 chat1.md 에서 founder 가 명시. 운영툴 톤 유지에 다크가 정체성.
- **비목표**: Phase 4 이후 라이트 토글 옵션은 별도 D-XXX 로 검토.
- **검증**: 모든 페이지 `bg-[#08090a]` 또는 `var(--bg)` 사용.

### D-004 — Hook 인증: Bearer + URL token 양쪽 지원
- **날짜**: 2026-05-11
- **상태**: 적용 (Phase 2 — T-105)
- **적용 TASK**: T-105
- **결정**: Edge Function `/hook-intake` 가 `Authorization: Bearer <HOOK_SHARED_SECRET>` (글로벌 secret + body.ownerId 필요) 또는 `?t=<url_token>` (hooks 테이블 lookup) 둘 다 허용.
- **배경**: Claude Scheduled Tasks 가 헤더 커스텀 가능 여부 불확실 → URL token fallback 필요.
- **비목표**: HMAC 서명 검증 — Phase 4 이후.
- **검증**: 양쪽 방식 모두 `supabase/functions/hook-intake/index.ts` 에서 분기 처리, intake_events 멱등성 보장.

### D-005 — Mock fallback 패턴 (Supabase 미구성 시 seed.ts 그대로)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-103 (React Query hooks)
- **결정**: 모든 React Query hook 의 `queryFn` 안에서 `isSupabaseConfigured` 분기:
  - `true` → `src/lib/api/*` 호출 (실 Supabase)
  - `false` → `src/data/seed.ts` 반환 (mock)
- **배경**: Phase 2 코드를 미리 작성해두지만, 사용자가 Doppler/Supabase provisioning 끝나기 전까진 mock 모드로 앱이 동작해야 한다. 환경변수 없이도 dev / build 통과.
- **비목표**: production 에서 mock 으로 떨어지는 건 절대 X — `.env.local` 없으면 `useAuth().configured` 가 false 라서 sidebar 에 명시 + login 페이지 경고.
- **검증**: 환경변수 없이 `npm run dev` 시 `/dashboard/posts` 가 seed 데이터로 정상 표시.

### D-008 — Single-user 자동 sign-in (`/login` 화면 우회)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-501
- **결정**: `.env.local` 또는 Doppler 에 `VITE_PUBLIC_AUTO_SIGNIN_EMAIL` + `VITE_PUBLIC_AUTO_SIGNIN_PASSWORD` 가 있으면 `AuthProvider` 가 mount 시 자동 `signInWithPassword` 호출. session 있으면 그대로 통과, 없으면 자동 로그인 후 통과. `/login` / `/auth-callback` 라우트는 보존 (로그아웃 또는 팀 모드 확장 시 대비).
- **배경**: 운영자(founder)가 혼자 쓰는 도구라 로그인 화면이 매번 마찰. 매직링크 메일 클릭 없이 dev/prod 둘 다 즉시 진입.
- **비목표**:
  - 팀 모드 확장: env 두 키를 비워두면 매직링크 흐름 복귀. 코드 변경 없이 toggle.
  - 비밀번호 안전성: `VITE_PUBLIC_` prefix 라 클라이언트 inline → 누구나 볼 수 있음. single-user 가정에서만 OK. 다른 사용자 추가하면 즉시 회전 + 토글.
- **검증**:
  - `signInWithPassword` 응답 200 + access_token 발급
  - 그 token 으로 `posts` REST → RLS 통과 (12 rows 보임)
  - dev server `/dashboard/posts` 200, `/login` 진입 시 자동 redirect → `/dashboard`

### D-007 — 디자인 styles.css 통째 도입 (Tailwind utility 변환 X)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-201 ~ T-206
- **결정**: 디자인 패키지의 `styles.css` (68KB) 를 `src/styles/design.css` 로 통째 복사. `globals.css` 가 그것을 import + Tailwind utilities 만 보조. 컴포넌트는 디자인 jsx 의 className (`.sidebar`, `.row`, `.preview`, `.cd-prompt-card`, `.wf-strip`, `.intake-feed`, `.t-stat` 등) 을 그대로 사용.
- **배경**: 디자인의 시각 결과를 Tailwind utility 로 매번 재구성하면 (1) 정확도 떨어짐, (2) 변환 작업이 페이지 5개에 걸쳐 매우 큼, (3) 디자인 업데이트 시 다시 변환해야 함. styles.css 통째 도입은 픽셀 정확도 최대 + 미래 디자인 변경 흡수 쉬움.
- **비목표**: Tailwind 제거 — 새로운 컴포넌트의 1회성 layout / spacing 은 Tailwind utility 가 여전히 편함. Tailwind base 는 design.css 가 자체 reset 을 가지므로 제거 가능하나 utilities 는 유지.
- **검증**: `npx vite build` 통과, CSS bundle 57.74KB (gzip 10.72KB) — Tailwind utility만 쓰던 시점 19KB 대비 +38KB. 5 페이지 전부 디자인과 매칭.

### D-006 — Database 타입은 `type` alias 만 사용 (interface 금지)
- **날짜**: 2026-05-11
- **상태**: 적용
- **적용 TASK**: T-108
- **결정**: `src/lib/supabase/types.ts` 의 모든 Row/Insert/Update 는 `interface` 가 아닌 `type` alias.
- **배경**: supabase-js 의 `SupabaseClient<Database>` generic 이 Schema 를 `extends GenericSchema` 로 체크하는데, `GenericTable.Row` 가 `Record<string, unknown>` 을 요구. TypeScript 의 `interface` 는 open 이라 `Record<string, unknown>` 을 자동 만족하지 않아 Schema 가 `never` 로 collapse → 모든 query/mutation 이 타입 에러.
- **비목표**: 향후 `supabase gen types` 로 자동 생성 시 이 룰을 깰 가능성 있음 — 그때는 D-XXX 로 보정 (CLI 가 type alias 로 출력하므로 OK).
- **검증**: `npx tsc -b` 통과 (Phase 2 진입 시 0 에러).
