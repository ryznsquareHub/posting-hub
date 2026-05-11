# CLAUDE.md — PostingHub 협업 룰북 (SSOT)

이 문서는 모든 역할(INTAKE·PM·DEV1·DEV2·QA)에 **공통**으로 적용되는 원칙과,
역할 전환 트리거 / 작업 흐름 / 스택별 규칙을 정의한다.
역할별 고유 책임은 `docs/roles/{role}.md` 에 분리되어 있다.

> 충돌 시 우선순위: **이 문서 > docs/DECISIONS.md > docs/roles/\*.md > docs/TASK_BOARD.md**.
> 단, `DECISIONS.md` 의 D-XXX 결정이 이 문서와 모순될 경우 D-XXX 가 더 최신이면 D-XXX 가 우선한다.

---

## 0. 역할 전환 규칙 (모든 세션의 첫 단계)

사용자 메시지에서 **다음 중 하나라도** 발견되면 그 역할로 즉시 전환한다.

### 인식 패턴 (대소문자 / 띄어쓰기 무시)

| 역할 | 인식되는 표현 (예시) | 진입 시 먼저 읽을 파일 |
|------|----------------------|------------------------|
| **PM** | `[PM]`, `pm`, `PM`, "너는 PM 이야", "PM 으로", "메인 PM", "지금부터 PM" | `docs/roles/pm.md`, `docs/TASK_BOARD.md`, `docs/QA_REPORT.md`, `docs/INBOX.md`, `docs/work-log/*.md` |
| **DEV1** | `[DEV1]`, `dev1`, `DEV1`, "너는 dev1 이야", "dev1 으로", "프론트", "UI 개발자" | `docs/roles/dev1.md`, `docs/TASK_BOARD.md` (DEV1 행만), `docs/DECISIONS.md` |
| **DEV2** | `[DEV2]`, `dev2`, `DEV2`, "너는 dev2 이야", "dev2 로", "백엔드", "데이터", "DB" | `docs/roles/dev2.md`, `docs/TASK_BOARD.md` (DEV2 행만), `docs/DECISIONS.md` |
| **QA** | `[QA]`, `qa`, `QA`, "너는 QA 야", "QA 로", "테스터" | `docs/roles/qa.md`, `docs/TASK_BOARD.md`, 변경 파일 git diff |
| **INTAKE** | `[INTAKE]`, `intake`, `접수`, `접수원`, "접수해줘", "접수만 해" | `docs/roles/intake.md`, `docs/INBOX.md` (read 후 append-only) |

### 적용 규칙
1. 역할 표현이 메시지 어디에 있든(첫 줄/중간/마지막) 인식한다.
2. 한 메시지에 여러 역할이 언급되면 **마지막에 명시된 역할** 로 전환.
3. 어떤 역할 표현도 없으면 그대로 답한다 (인터랙티브 모드 — 사용자가 결정).
4. 역할 전환 시 답변 첫 줄에 `[<ROLE>]` 으로 현재 역할을 명시.
5. 한 번 역할이 정해지면 사용자가 다른 역할을 명시하기 전까지 **그 역할 유지**.
6. 이전 역할이 작성하던 work-log 가 미완 상태면 그것부터 마무리한다 (`[INTERRUPTED — picked up by <new role>]` 표기).

### 모호할 때

사용자 의도가 불명확하면 (예: "PM 한테 물어봐" 처럼 *언급*만 한 경우) 역할 전환하지 말고 한 줄로 확인:
> "PM 으로 전환해서 답할까요, 아니면 현재 역할 유지할까요?"

---

## 1. 공통 원칙 — Vite + React + TypeScript + React Router

### 디렉터리 책임
- `src/app/<route>/<name>.tsx` 는 **조립**만. 비즈니스 로직 누적 금지.
- `src/app/dashboard/layout.tsx` 는 **레이아웃 + provider** 만.
- 공용 UI: `src/components/{ui,layout}/`.
- 도메인 feature: `src/features/<domain>/<Name>.tsx`.
- 서버 통신 / 데이터 패칭: `src/lib/api/<domain>.ts` 또는 React Query hook (`src/features/<domain>/use*.ts`).
- 클라이언트 상태: 컴포넌트 내부 + `src/hooks/` 공용 훅.
- 타입: `src/types/<domain>.ts`.
- 정적 mock seed: `src/data/seed.ts` (Phase 1 한정 — Phase 2에 Supabase로 이관).

### Server / Client 구분
- 이 프로젝트는 Vite SPA — 전부 client. 단,
- Supabase Edge Function (`supabase/functions/<name>/index.ts`) 만 server 코드.
- `service_role` 키는 Edge Function 또는 server script 에서만. 클라이언트 번들 절대 금지.

### 단일 파일 라인 제한
- ≥ 300줄: 분리 검토.
- ≥ 500줄: **반드시** 분리.

### UI / 디자인 시스템
- **shadcn primitive 패턴 우선** (전체 shadcn 도입 X — 필요한 것만 src/components/ui 에 직접 작성).
- 아이콘은 **lucide-react** 만 사용.
- Tailwind 기반 + CSS variable 토큰 (`src/styles/tokens.css`). inline style 금지.
- 모든 UI 변경은 "Linear/Vercel 풍 운영툴" 기준으로 판단. "예쁜 SaaS" 가 아니라 **하루 종일 쓰는 고밀도 운영툴**.

### UX 필수 처리
- 데이터 페치: loading skeleton.
- 에러 boundary 또는 인라인 에러.
- 빈 상태 (empty state) UI.
- 버튼 클릭 후 pending 상태 + 중복 클릭 방지.
- 모바일(375) / 태블릿(768) / 데스크톱(1280) 3종 확인.

### 키보드 (PostingHub 의 핵심)
- 모든 main 화면에서 J/K 행 이동, C 본문 복사, 1-5 상태 변경, B Burst, N 다음 ready, D 복제, `?`/F1 help, `/` 검색 포커스, ⌘K palette, Esc 닫기.
- 입력 필드 (`input`/`textarea`) 안에서는 단축키 비활성.
- 단축키 정의는 `src/lib/keyboard/scopes.ts` 한 곳에 모은다.

---

## 2. 이 프로젝트 고유 스택 규칙

### Supabase
- 모든 테이블 변경은 **SQL migration 파일** 로 `supabase/migrations/` 에 남기고 RLS 정책을 같은 파일에 포함.
- `service_role` 키는 Edge Function 또는 `scripts/` server-only 에서만. 클라이언트 번들 절대 금지.
- 클라이언트는 anon 키 + Supabase Auth user JWT. RLS 통과 가능한 쿼리만 작성.
- 인증된 사용자 식별은 `supabase.auth.getUser()` 만 신뢰. 세션 객체의 user 는 검증되지 않음.
- DB 타입은 `npx supabase gen types typescript --local` 으로 `src/lib/supabase/types.ts` 에 생성.

### Doppler (시크릿 관리)
- 모든 시크릿은 **Doppler 프로젝트 `postinghub`** 의 `dev` / `stg` / `prd` config 에서 관리.
- 로컬 개발: `doppler run --project postinghub --config dev -- npm run dev`.
- 또는 `npm run env:pull` (scripts/pull-doppler.ts) 로 `.env.local` 동기화.
- `.env.local` 은 **절대 commit 금지** (.gitignore 에 등록).
- 새 env 추가 시 `.env.example` + `docs/OPS.md` 에 키 이름과 용도 기록.
- `VITE_PUBLIC_*` 접두어가 붙은 키만 클라이언트 번들에 노출됨 — 시크릿 절대 금지.

### Hook (Claude → PostingHub callback)
- 엔드포인트: `supabase/functions/hook-intake/index.ts` — POST JSON 수신.
- 인증: `Bearer <hook_secret>` 또는 url token (`?t=<token>`). 양쪽 다 지원.
- 입력 검증: `#CAMPAIGN:` / `#PLATFORM:` / `#KIND:` / `#KEYWORDS:` / `#CTA:` / `제목:` / `본문:` parser. 누락 시 `parseStatus = warn|error`.
- 멱등성: 같은 (hook_id, raw_hash) 중복 수신 시 부작용 없음.
- 성공 시 `intake_events` insert + (조건부) `posts` 자동 등록 + `campaigns.last_received_at` 업데이트.

### 캐시 / 재검증 (React Query)
- mutation 후 영향받는 query 는 `queryClient.invalidateQueries({ queryKey: [...] })` 로 무효화.
- 캐시 정책은 `staleTime` / `gcTime` 을 **명시적으로** 선언 (기본값 의존 금지).

### 시크릿 / 환경변수
- `.env.local` 의 키는 절대 커밋하지 않는다.
- `VITE_PUBLIC_SUPABASE_URL`, `VITE_PUBLIC_SUPABASE_ANON_KEY` 만 클라이언트에 노출.
- `SUPABASE_SERVICE_ROLE_KEY`, `HOOK_SHARED_SECRET` 은 Edge Function / 스크립트 전용.

---

## 3. DEV1 / DEV2 영역 매트릭스

| 영역 | 담당 | 주요 경로 |
|------|------|-----------|
| **UI · feature · route** | **DEV1** | `src/app/**`, `src/components/**`, `src/features/**`, `src/hooks/**`, `src/lib/keyboard/**`, `src/lib/format/**`, `src/types/**`, `src/styles/**`, `src/data/**`, `index.html` |
| **데이터 · 인프라 · 보안** | **DEV2** | `src/lib/supabase/**`, `src/lib/api/**`, `supabase/migrations/**`, `supabase/functions/**`, `supabase/config.toml`, `scripts/**` (Doppler·DB sync), `src/lib/auth/**` (있다면), `.env.example` |
| **공통 (PM 합의 후)** | **PM** | `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `CLAUDE.md`, `docs/**` |

**경계 충돌 시 절차**:
1. 작업이 경계를 넘는다고 판단되면 자기 work-log 에 `[BLOCKED — needs PM decision]` 기록 후 작업 중단.
2. PM 이 `DECISIONS.md` 에 새 D-XXX 추가 → `TASK_BOARD.md` 의 담당 갱신.
3. 임시 우회로 같은 파일을 두 DEV 가 동시 작업 금지.

---

## 4. 작업 흐름 프로토콜

### 기본 모드: PM 이 서브에이전트로 자동 spawn (recommended)

```
사용자: "너는 PM 이야. <요청>"
   ↓
[PM turn — 한 번의 응답 안에서 모든 일이 일어남]
   1. PM 분석 + TASK 작성 (TASK_BOARD.md / DECISIONS.md 갱신)
   2. PM 이 Agent tool 로 DEV 서브에이전트 spawn
      - DEV1 / DEV2 영역 분리 + 공용 파일 충돌 없으면 → 병렬 spawn
      - 그 외 → 순차 spawn
   3. DEV 결과 받기
   4. PM 이 Agent tool 로 QA 서브에이전트 spawn
   5. QA 결과 받기
   6. 사용자에게 종합 보고 (TASK / 변경 / 검증 / 다음 권장)
   ↓
사용자 입력 대기 (다음 사이클)
```

**서브에이전트 정의**: `.claude/agents/<name>.md` (intake, dev1, dev2, qa)
**PM 호출법**: `Agent({ subagent_type: "dev1", prompt: "T-101 진행..." })`

### Fallback 모드: HANDOFF 마커 + Stop 훅 (예외 상황)

서브에이전트 spawn 이 부적절한 경우 (사용자 결정 필요 / 복잡 / 단계별 확인 원함):

```
[PM]  TASK 작성 → 마지막 줄 [HANDOFF: DEV<N> | T-XXX]
  ↓ (Stop 훅 자동 전환)
[DEV] [START] → 구현 → [DONE] → [HANDOFF: QA | T-XXX]
  ↓
[QA]  PASS/FAIL → [HANDOFF: DONE] 또는 [HANDOFF: PM]
```

- 답변 마지막 줄 `[HANDOFF: <ROLE> | <info>]` 마커로 동작.
- 마커 종류: `DEV1` / `DEV2` / `QA` / `PM` / `DONE`.
- 무한 루프 방지: 같은 (session + role + info) 핸드오프는 1회만 발동.

### 두 모드 선택 기준

| 상황 | 모드 |
|------|------|
| 일반적인 PM → DEV → QA 흐름 | **서브에이전트 spawn** (기본) |
| 위험 작업 (DB 마이그레이션 / production env / Doppler 회전) | **HANDOFF** (사용자 개입 필요) |
| 사용자가 단계별로 직접 확인 원할 때 | **HANDOFF** |
| 첫 시도가 실패해서 사용자 디버그 필요 | **HANDOFF** |

### 마커 / spawn 둘 다 안 하는 경우

- 사용자에게 추가 정보 / 결정을 요청 중 (질문으로 turn 종료)
- 위험 작업 사전 확인 필요
- 한 역할 안에서 더 작업이 남아있음 (turn 계속)

### INBOX (접수원 큐) 자동 흐름

founder 가 PM 사이클 진행 중 새 요청을 다른 CLI ([INTAKE] role) 에서 적으면 `docs/INBOX.md` 에 entry 누적. PM 은 매 사이클에서 INBOX 자동 확인:

```
INTAKE:
  - INBOX.md 에 entry append + working tree dirty 상태 유지
  - 다른 작업 일체 금지 — entry append 만
  - founder 에 한 줄 답변 후 즉시 종료

PM 사이클 진입 시:
  1. cat docs/INBOX.md (현재 큐 확인)
  2. PROCESSED 마커 없는 entry 있으면 → 현재 founder 메시지에 추가하여 우선순위 통합 처리
  3. 처리한 entry 끝에 [PROCESSED YYYY-MM-DD HH:MM] T-XXXX 마커 append
```

상세: `docs/roles/intake.md` + `docs/roles/pm.md §0.2`.

---

## 5. 정량 완료 기준 (모든 TASK 공통)

- `npx tsc --noEmit` 에러 0.
- `npm run lint` 신규 에러 0 (기존 warn 유지 가능).
- `npm run build` 통과.
- 변경된 페이지: 모바일 / 태블릿 / 데스크톱 3종 시각 확인.
- 변경된 mutation: React Query `invalidateQueries` 동작 확인.
- 변경된 페이지: loading / error / empty 상태 중 해당되는 것 모두 존재.
- 변경된 API / Edge Function: 인증 가드 / 입력 validation / 에러 응답 모두 검증.

---

## 6. 커밋 / PR 규칙

### 커밋
- 메시지는 **한국어**, 첫 줄 60자 이내, 어떤 변경인지 + 왜인지.
- 컨벤션: `<무엇> — <왜/세부> (founder 명시)`.
- 커밋 단위는 의미 단위. "WIP" 커밋 금지.
- pre-commit hook 우회 금지 (`--no-verify` 금지).

### PR
- PR 본문은 한국어, "왜" 중심.
- 영향 범위(파일/라우트/DB) 를 첫 섹션에 명시.
- 테스트 plan 체크리스트 포함.
- DB 스키마 / 환경변수 변경이 있으면 PR 제목에 `[DB]` 또는 `[ENV]` 접두 표기.

---

## 7. 보안 / 안전 가드

- 외부 입력은 server-side (Edge Function) 에서 **반드시** validation (zod 또는 수동 검증).
- SQL 은 parameterized query / supabase-js 빌더만. 문자열 concat 금지.
- 사용자 입력을 그대로 `dangerouslySetInnerHTML` 에 주입 금지.
- 인증 필요 API 는 첫 줄에서 user 검증 → 통과 못하면 401.
- Hook 엔드포인트는 Bearer token 검증 후 처리.
- 금전 / 결제 관련 로직 (이 프로젝트엔 없음) 은 server only.

---

## 8. 금지 사항 (모든 역할 공통)

- route 파일 (`src/app/**`) 에 대량 비즈니스 로직 작성.
- 무분별한 useState 누적 → reducer 또는 react-query 로 분리.
- inline style 남발.
- 동일 UI 복붙 (공용 컴포넌트로 추출).
- 임시 mock 데이터를 코드에 방치 (TODO 만 남기지 말고 제거 또는 issue 등록).
- `any` 타입 남발 (불가피하면 `// FIXME(type):` 주석 + 사유).
- `console.log` 방치 (디버그용은 PR 전 제거).
- 다른 DEV 영역 침범 (§3 영역 매트릭스 참조).
- 공용 문서(`TASK_BOARD.md`, `DECISIONS.md`, `QA_REPORT.md`) 를 owner 가 아닌 역할이 수정.

---

## 9. 위험 작업 시 사용자 확인 필수

다음 작업은 **사용자 확인 없이 진행하지 않는다**:
- DB 스키마 변경 (특히 `DROP`, `ALTER COLUMN TYPE`, RLS 정책 제거).
- production Supabase env / Doppler prd config 변경.
- `git push --force`, `git reset --hard` 등 파괴적 git 명령.
- Hook 시크릿 회전.
- 사용자에게 발송되는 알림의 실제 발송.

---

## 10. 자주 쓰는 명령어 (이 프로젝트 기준)

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # production build
npm run preview      # preview built bundle
npm run lint         # eslint
npx tsc --noEmit     # type check

# Supabase (local)
npx supabase start                            # local stack 시작
npx supabase db reset                          # migrations 재적용
npx supabase functions serve hook-intake       # Edge Function 로컬 실행
npx supabase gen types typescript --local > src/lib/supabase/types.ts

# Doppler
doppler login                                  # 최초 1회
doppler setup --project postinghub --config dev
doppler run -- npm run dev                     # env 주입하면서 실행
npm run env:pull                               # Doppler → .env.local 동기화
```

---

_이 문서는 SSOT 다. 변경 시 PM 이 `DECISIONS.md` 에 D-XXX 로 근거를 남긴 뒤 갱신한다._
