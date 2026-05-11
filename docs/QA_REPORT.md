# QA_REPORT — PostingHub

> QA 단독 owner. 추가만. 형식: `docs/roles/qa.md §4` 참조.

---

## Q-LIVE-001 (E2E QA — 신규 캠페인 + Hook 흐름 + 복사 + 상태 + RLS)
- **상태**: PASS
- **검증자**: QA (Node E2E 스크립트 `scripts/qa-e2e.mjs`)
- **재현 환경**: Supabase Cloud `ovdefrvxjblkiewempug` (cloud DB) · Node 20 · 2026-05-11
- **시나리오 (10개, assertion 26개)**:
  1. 신규 캠페인 `c_qa_test_kids` 생성 (PostgREST POST → 201)
  2. variant 매핑 2개 (blog_seo + cafe_review)
  3. PromptBuilder 토큰 치환 (`{brand}/{cta}/{batchSize}` 모두 치환됨)
  4. Hook callback 시뮬 — `intake_events` insert + `posts` 자동 생성 (`status=ready`, `copy_count=0`)
  5. 1-click 복사 시뮬 — `copy_count` 0→1, status `ready`→`published` 자동 전이
  6. 상태 변경 시뮬 — `scheduled` 변경 + `scheduled_at` 저장
  7. Scoped search — `kw:QA platform:blog` 매칭 (matchesScoped 로직)
  8. RLS — anon 로그인 시 다른 user 의 posts 차단 (0 rows)
  9. variant_presets public read 통과
  10. Cleanup — 테스트 데이터 전부 삭제 확인
- **기대 결과**: 모든 assertion PASS
- **실제 결과**: **PASS 26 / FAIL 0**
- **사용자 권장 검증**:
  - UI 로 직접 (`/dashboard/posts` 의 row 클릭 → C 복사 → toast + row flash + status pill 변경)
  - `/dashboard/campaign/:id` 의 variant 탭 전환 → prompt 즉시 재빌드 확인
  - `/dashboard/import` 의 5 탭 동작
  - 모바일 (375) / 태블릿 (768) / 데스크톱 (1280) 시각 확인

---

## Q-LIVE-002 (코드 측 — tsc / build / lint)
- **상태**: PASS
- **검증자**: QA (CLI)
- **결과**:
  - `npx tsc -b` — 에러 0
  - `npx vite build` — 성공 (JS 680KB / CSS 56KB / gzip 195KB)
  - `npx eslint .` — **error 0**, warning 5 (Fast Refresh 효율성 알림 — production 영향 없음)
- **사용자 권장 검증**: `npm run dev` 실행 후 브라우저 콘솔 0 에러 확인

---

## Q-LIVE-003 (Cloud DB 데이터 무결성)
- **상태**: PASS
- **검증자**: QA (REST count via service_role)
- **상태표 (Supabase REST `Content-Range` count)**:

| table | rows |
|---|---|
| campaigns | 8 |
| campaign_variants | 23 |
| posts | 12 |
| prompts | 6 |
| templates | 6 |
| hooks | 2 |
| intake_events | 10 |
| imports | 4 |
| variant_presets | 5 (system) |

- **사용자 권장 검증**: Supabase Dashboard → Table Editor 에서 row 수 일치 확인

---

## Q-LIVE-004 (라우트 응답)
- **상태**: PASS
- **검증자**: QA (curl)
- **결과**: 9 라우트 모두 HTTP 200
  - `/dashboard` · `/dashboard/posts` · `/dashboard/campaign/c_jamsil_kids` · `/dashboard/templates` · `/dashboard/prompt-library` · `/dashboard/import` · `/dashboard/history` · `/dashboard/settings` · `/login`

---

## 다음 권장 (사용자 직접 확인)
1. 매직링크로 로그인 → Sidebar 의 Automation block 이 cloud 데이터 derive 값으로 표시
2. 캠페인 클릭 → Variant 탭 / Prompt 즉시 빌드 / [복사] CTA → toast
3. Posts row 에서 C 키 → DB 의 copy_count 가 실제 증가하는지 (F5 후에도)
4. ⌘K palette → 캠페인 이름으로 점프
5. `/dashboard/import` 5 탭 — Manual Paste 에 샘플 붙여넣고 파싱 카드 확인
