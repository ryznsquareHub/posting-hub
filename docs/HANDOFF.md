# HANDOFF — PostingHub

> 환경 / 시크릿 / 외부 키 / 운영 노트의 인계 문서.
> 새 키 추가 시 키 이름 + 용도만 기록 (값은 절대 X — Doppler 에).

---

## 환경 변수 (Doppler `postinghub` project)

| 키 | 노출 범위 | 용도 |
|---|---|---|
| `VITE_PUBLIC_SUPABASE_URL` | 클라이언트 + 서버 | Supabase project URL |
| `VITE_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 + 서버 | Supabase anon key (RLS 보호) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 only | service_role (Edge Function 전용 — 절대 클라 노출 X) |
| `HOOK_SHARED_SECRET` | Edge Function only | Hook 엔드포인트 Bearer auth secret |

## Doppler config

| Config | 용도 |
|---|---|
| `dev` | 로컬 개발 — Supabase 로컬 또는 dev project |
| `stg` | 스테이징 — Supabase staging project |
| `prd` | 프로덕션 — Supabase prod project (사용자 확인 필수) |

## Supabase

| 항목 | 메모 |
|---|---|
| Project | (Phase 2 진입 시 생성) |
| Region | 한국 사용자 기준 `ap-northeast-2` 또는 `ap-northeast-1` |
| Auth | Email + Magic Link |
| Edge Functions | `hook-intake` (Phase 2) |

## 운영 노트

- 모든 시크릿 회전은 사용자 확인 후 (CLAUDE.md §9).
- Hook 시크릿 회전 시 Claude Scheduled Tasks 의 webhook 설정도 동기 갱신.
