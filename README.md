# PostingHub

AI 콘텐츠 운영 OS — Claude 기반 캠페인 / 포스트 운영 허브.

> 흐름: PostingHub → 사용자 → Claude (Prompt 복사),
> Claude → Hook → PostingHub (결과 자동 저장).

운영자가 하루 종일 사용하는 **고밀도 다크 운영툴**. 마케팅 SaaS 가 아니라 Linear / Vercel 톤.

---

## Stack

- **Frontend**: Vite 5 + React 18 + TypeScript + Tailwind 3 + React Router 6
- **Data**: Supabase (Postgres + Auth + Edge Functions) + `@tanstack/react-query`
- **Secrets**: Doppler (`postinghub` 프로젝트 / `dev` / `stg` / `prd`)
- **Icons**: lucide-react
- **Toast**: sonner

자세한 설계: `docs/IMPLEMENTATION_PLAN.md`.

---

## 시작하기

### Cloud SaaS 셋업 (최초 1회 — 약 10분)
**자세한 가이드**: `docs/SETUP_CLOUD.md`

요약:
1. **Supabase Cloud** (supabase.com) — `postinghub` 프로젝트 생성 + `supabase/INIT_ALL.sql` 를 SQL Editor 에서 Run + Auth Email Magic Link 활성화
2. **Doppler Cloud** (dashboard.doppler.com) — `postinghub` 프로젝트 + `dev` config 에 4 secrets 입력
3. **`.env.local`** 자동 생성 (Doppler 에서 또는 MCP 로)

```bash
npm install                       # 최초 1회
doppler run -- npm run dev        # Doppler env 주입하면서 dev
# 또는
npm run env:pull && npm run dev   # .env.local 한 번 만들고 그냥 dev
```

> Cloud 셋업 전에도 `npm run dev` 가 동작. 환경변수 없으면 `src/data/seed.ts` mock 으로 자동 fallback. Supabase 가 구성되면 자동으로 cloud 데이터 사용 (D-005 mock fallback 패턴).

http://localhost:5173 — `/dashboard/posts` 가 핵심 화면.

### 키보드 (PostingHub 의 정체성)

- `J` / `K` — 다음 / 이전 행
- `C` — 본문 복사 (status auto-transition + 1.4s flash)
- `⇧C` / `⌥C` — 제목만 / CTA만 복사
- `1` ~ `5` — 상태 즉시 변경 (draft / ready / scheduled / published / archived)
- `B` — Burst 모드 (C 누르면 다음 ready 로 자동 이동)
- `N` — 다음 발행대기로 점프
- `D` — 현재 행 복제
- `/` — 검색 포커스 / `?` — 도움말 / `Esc` — 닫기
- `G P` / `G O` / `G I` / `G L` / `G T` — 페이지 이동
- `⌘K` — Command palette (Phase 1 다음 사이클)

`/` 검색은 `platform:blog`, `status:ready`, `kind:variant`, `kw:할인`, `region:서울` 같은 토큰 지원.

---

## 폴더 구조 / 협업 룰

- 코드 구조: `docs/IMPLEMENTATION_PLAN.md`
- 협업 룰북 (역할별 책임): `CLAUDE.md`
- 역할 정의: `docs/roles/{intake,pm,dev1,dev2,qa}.md`
- 작업 보드: `docs/TASK_BOARD.md`
- 결정 누적: `docs/DECISIONS.md`

## 현재 Phase

- ✅ Phase 0: 협업 인프라 + 스캐폴드
- ✅ Phase 1: 모든 페이지 (mock 동작)
- ✅ Phase 1.5: 디자인 패키지 픽셀 매핑 — `styles.css` 통째 도입 + 모든 페이지 1:1 변환
- ✅ Phase 2 (코드): Supabase client + RLS migration + API + React Query + Auth + Hook Edge Function
  - ⏳ 사용자 작업 대기: Doppler `postinghub` 프로젝트 + Supabase 프로젝트 → `docs/OPS.md`
- ✅ Phase 3: Cmd+K palette + HelpOverlay 디자인 매칭 + scoped search 정밀화 (matchesScoped) + History/Settings 페이지 강화
- ✅ Phase 4 (docs): Claude Scheduled Tasks 운영 가이드 → `docs/CLAUDE_SCHEDULED_TASKS.md`

## 운영 메모

- Supabase RLS 정책 없이 새 테이블 추가 금지.
- `service_role` 키는 절대 클라이언트에 노출 X — Edge Function / scripts 전용.
- Hook 시크릿 회전 / production env 변경은 사용자 확인 필수 (`CLAUDE.md §9`).
