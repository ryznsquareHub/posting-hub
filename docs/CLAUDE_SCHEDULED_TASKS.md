# Claude Scheduled Tasks — PostingHub 통합 가이드

> PostingHub 의 핵심 흐름: **Prompt 복사 → Claude 실행 → Hook callback → 자동 저장**.
> 이 문서는 운영자가 Claude Desktop / Claude Scheduled Tasks 를 PostingHub Hook 엔드포인트와 연결하는 절차를 다룬다.

---

## 0. 흐름 개요

```
[PostingHub /campaign/:id]
    ↓ Prompt 복사
[Claude Desktop or Scheduled Tasks]
    ↓ Structured Output 생성
[POST → Supabase Edge Function hook-intake]
    ↓ Parse + Idempotency 체크
[intake_events insert + (조건부) posts insert]
    ↓
[PostingHub /dashboard/import 에서 결과 확인 → /dashboard/posts 로 발행]
```

핵심: PostingHub 는 글을 **생성하지 않는다**. 운영자가 Claude 에 prompt 를 복사 → Claude 가 글 생성 → Hook 으로 PostingHub 에 자동 반환.

---

## 1. Claude Scheduled Tasks 설정 (Anthropic Console)

> Anthropic Console / Claude.ai 의 Scheduled Tasks 기능은 시간 기준으로 prompt 를 실행하고 결과를 webhook 으로 전달한다.

### 1-1. PostingHub 에서 Hook URL 발급
1. `/dashboard/import` 진입 → "Hook 엔드포인트" 탭
2. 캠페인 또는 워크플로우별로 **Hook 생성** (Phase 2 진입 시 UI 제공 — Phase 3 까지는 직접 SQL)
3. 생성된 URL 복사: `https://<your-project>.supabase.co/functions/v1/hook-intake?t=<url_token>`

### 1-2. Claude Scheduled Tasks 등록
| 항목 | 값 |
|---|---|
| **Task name** | `posting-hub-잠실키즈카페-blog-seo` (캠페인+variant 기준) |
| **Prompt** | PostingHub `/dashboard/campaign/:id` 에서 복사한 **Claude Prompt** 전체 |
| **Schedule** | `0 8 * * *` 매일 08:00 (또는 원하는 cron) |
| **Webhook URL** | 위 1-1 의 URL |
| **Webhook method** | POST |
| **Webhook content-type** | `application/json` |
| **Body template** | `{"raw": "{{output}}"}` — Claude 출력을 `raw` 필드에 그대로 포장 |

> Claude Scheduled Tasks 가 헤더 커스텀을 지원하면 `Authorization: Bearer $HOOK_SHARED_SECRET` 도 추가. 지원 안 하면 `?t=<url_token>` 만으로 OK (D-004).

### 1-3. 첫 실행 확인
- Scheduled Tasks 첫 fire → PostingHub `/dashboard/import` 의 **자동 수집 라이브** 탭에 새 entry
- `parse_status: ok` → `posts` 자동 등록 + `/dashboard/posts` 의 row 에 ready 상태
- `parse_status: warn` 또는 `error` → entry 만 기록 (수동 확인 필요)

---

## 2. Prompt 형식 (Structured Output)

Claude 가 반드시 따라야 할 출력 형식. PostingHub `/dashboard/prompt-library` 의 모든 워크플로우는 이 형식을 강제하는 system prompt 를 사용한다.

```
#CAMPAIGN: 잠실 키즈카페       ← 캠페인 자동 매칭 (이름 정확히)
#PLATFORM: BLOG                 ← BLOG | CAFE
#KIND: 원본                     ← 원본 | 변형 | 재활용
#KEYWORDS: 잠실키즈카페, 주말데이트, 아이와함께
#REGION: 잠실
#INDUSTRY: 키즈카페
#CTA: 주말 예약 필수

제목: (한 줄 제목)

본문:
... 본문 ...
... 줄바꿈 그대로 보존 ...

---

#CAMPAIGN: 강남 미용실
... (다음 글)
```

### 파싱 규칙 (`supabase/functions/hook-intake/index.ts` 의 parser)
- `#KEY: value` 라인은 모두 메타 (대문자 키)
- `제목:` 한 줄
- `본문:` 다음 라인부터 본문 (다음 `---` 또는 EOF 까지)
- 다중 글: `---` 또는 `===` 로 구분, 또는 두 번째 `#CAMPAIGN:` 라인부터 자동 분할

### 경고 / 에러 분류
- **OK**: 제목 + 본문 + 모든 `#*` 메타가 있음
- **WARN**: 제목·본문 있지만 일부 `#*` 메타 누락 (예: `#CTA 누락`)
- **ERROR**: 제목 또는 본문 누락 → posts 등록 안 함, intake_events 만 기록

---

## 3. Claude Desktop (수동 실행) 흐름

Scheduled Tasks 가 없는 환경에서 운영자가 직접 Claude 실행:

1. PostingHub `/dashboard/campaign/:id` → Variant 선택 → **[프롬프트 복사]**
2. Claude Desktop 새 대화에 붙여넣고 실행
3. Claude 가 structured output 으로 답변
4. (선택) PostingHub `/dashboard/import` → **Manual Paste 탭** 에 결과 붙여넣기
5. 또는 Claude Desktop 의 결과를 그대로 webhook 으로 보내는 Claude Tool / 자동화 사용 (`HOOK_SHARED_SECRET` 인증)

> Manual Paste 도 **같은 parser** 를 사용 (`src/features/intake/parseClaudeOutput.ts`).

---

## 4. Curl 테스트 (개발 검증용)

### Bearer 인증 + ownerId 명시
```bash
curl -X POST "https://<project>.supabase.co/functions/v1/hook-intake" \
  -H "Authorization: Bearer $HOOK_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "<your-auth-uid>",
    "raw": "#CAMPAIGN: 잠실 키즈카페\n#PLATFORM: BLOG\n#KIND: 원본\n#KEYWORDS: 잠실키즈카페, 주말데이트\n#REGION: 잠실\n#INDUSTRY: 키즈카페\n#CTA: 주말 예약 필수\n\n제목: 잠실 키즈카페 솔직 후기\n\n본문:\n주말에 다녀온 잠실 키즈카페..."
  }'
```

### URL token 인증 (캠페인별)
```bash
curl -X POST "https://<project>.supabase.co/functions/v1/hook-intake?t=<url_token>" \
  -H "Content-Type: application/json" \
  -d '{ "raw": "..." }'
```

### 기대 응답
```json
{ "ok": true, "ingested": 1, "posts": 1, "errors": [] }
```

---

## 5. 모니터링 / 운영

### 매일 확인
- `/dashboard` (Today) — **AI 자동 수집 24h** stat 가 평소 범위 안인지
- `/dashboard/import` — `자동 수집 라이브` 의 `WARN` / `ERROR` 가 비정상으로 많지 않은지
- Hook 엔드포인트의 `p50 latency` 가 1초 이내인지

### 트러블슈팅
| 증상 | 원인 후보 | 조치 |
|---|---|---|
| 새 글이 안 들어옴 | Claude Scheduled Tasks fire 실패 / Hook 401 | Anthropic Console 의 task 실행 로그 + Supabase `Edge Function logs` |
| `ERROR` 만 누적 | Claude 가 형식 무시 | Variant 의 system prompt 강화 → prompt 다시 복사 |
| 같은 글이 중복 등록 | parser 의 `raw_hash` 충돌 회피 실패 | `intake_events` 의 `raw_hash` 컬럼 확인, 멱등성 보장 |
| Hook URL 노출 | `url_token` 외부 유출 | `hooks` 테이블에서 해당 token 의 `status='off'` 설정 + 새 token 발급 |

### 시크릿 회전 (사용자 확인 필수 — CLAUDE.md §9)
1. Doppler 에서 `HOOK_SHARED_SECRET` 새 값으로 업데이트 (3 config 모두)
2. `supabase functions deploy hook-intake` 재배포
3. Claude Scheduled Tasks 의 인증 헤더 동시 갱신
4. 검증: curl 테스트로 OK 200 응답 확인 후 운영

---

## 6. 향후 확장 아이디어

- **Auto-retry**: ERROR entry 자동 재시도 (parser 가 더 너그러운 fallback 모드)
- **Variant A/B**: 같은 캠페인의 여러 variant 를 같은 prompt 안에 묶어 실행
- **결과 자동 발행**: parse_status=ok + auto-publish 옵션 → posts.status='published' 즉시
- **알림**: parse_status=error 누적 시 founder 에게 webhook / email 알림
- **Claude SDK 직접 호출**: PostingHub Edge Function 에서 직접 Anthropic API 호출 (현재는 user-mediated)

각 항목은 D-XXX 로 결정 후 진행.
