# OPS — 운영 / 배포 / 시크릿 가이드

> 이 문서는 운영자(founder)가 직접 수행해야 할 인프라 작업 가이드.
> 코드 변경은 PM → DEV1/DEV2 사이클로, 인프라 변경은 이 문서를 따라 founder 가 직접.

---

## 0. 한 줄 흐름

```
Doppler `postinghub` 프로젝트 ─┐
                              ├─ secrets ─→ Vite dev / Edge Functions
Supabase `postinghub` 프로젝트 ─┘
```

Doppler 가 모든 시크릿의 SSOT. Supabase 가 데이터 / 인증 / Hook 엔드포인트의 SSOT.

---

## 1. Doppler 프로젝트 만들기 (최초 1회)

```bash
# 1) 로그인
doppler login

# 2) 프로젝트 생성
doppler projects create postinghub

# 3) configs 추가 — dev 는 기본 생성됨, stg / prd 추가
doppler configs create dev_stg --project postinghub --environment stg
doppler configs create dev_prd --project postinghub --environment prd
# (또는 Doppler 대시보드에서 GUI 로 stg / prd config 추가)

# 4) 이 디렉터리에 doppler setup — 어느 config 를 쓸지 묶음
cd D:/2026_workspace/PostingHub
doppler setup --project postinghub --config dev
```

> 위 `dev` config 가 로컬 개발용. PR / 배포 시점에 stg/prd 로 스위치.

---

## 2. Supabase 프로젝트 만들기 (최초 1회)

### 옵션 A — 로컬 전용 (권장 시작점, 무료, 빠름)

```bash
# Supabase CLI 설치 (Windows: scoop install supabase, macOS: brew install supabase/tap/supabase)
supabase --version

# 로컬 Postgres + API + Studio 부팅
cd D:/2026_workspace/PostingHub
supabase start
# → URL/keys 출력됨. supabase status 로 재확인.

# Migrations 적용
supabase db reset    # 0001_init.sql + 0002_seed_variant_presets.sql 적용

# Edge Function 로컬 실행
supabase functions serve hook-intake --no-verify-jwt --env-file .env.local
```

`supabase start` 가 출력하는 값을 Doppler 에 넣는다:

```bash
# 출력 예시:
#   API URL:          http://localhost:54321
#   anon key:         eyJh...
#   service_role key: eyJh...

doppler secrets set --project postinghub --config dev \
  VITE_PUBLIC_SUPABASE_URL="http://localhost:54321" \
  VITE_PUBLIC_SUPABASE_ANON_KEY="eyJh..." \
  SUPABASE_SERVICE_ROLE_KEY="eyJh..." \
  HOOK_SHARED_SECRET="phk_dev_$(openssl rand -hex 12)"
```

### 옵션 B — Supabase Cloud (production 용)

1. https://supabase.com → New project (region: `ap-northeast-2` 한국 또는 `ap-northeast-1` 도쿄)
2. Settings → API → URL / anon / service_role 키 복사
3. Doppler `postinghub` 프로젝트 `prd` config 에 같은 키 이름으로 set
4. Migrations 적용:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push                   # supabase/migrations 전부 적용
   supabase functions deploy hook-intake
   ```
5. **prd 변경은 사용자 (founder) 확인 후 진행** (CLAUDE.md §9).

---

## 3. 일상 개발 흐름

### 매 세션 시작
```bash
doppler run -- npm run dev        # Doppler 가 env 주입
# 또는 한 번만:
npm run env:pull                  # .env.local 생성 (gitignored)
npm run dev                       # vite dev
```

### Supabase 스키마 변경
```bash
# 1) 새 migration 파일 작성
# supabase/migrations/0003_<무엇>.sql

# 2) 로컬 적용
supabase db reset                 # 또는 db push (덜 파괴적)

# 3) 타입 재생성
npm run supabase:gen-types        # src/lib/supabase/types.ts 업데이트

# 4) 코드에서 사용 → tsc / lint / build 확인
```

### Edge Function 변경
```bash
# 로컬 테스트
supabase functions serve hook-intake --env-file .env.local

# 호출 테스트 (Bearer)
curl -X POST http://localhost:54321/functions/v1/hook-intake \
  -H "Authorization: Bearer $HOOK_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"ownerId":"<uuid>","raw":"#CAMPAIGN: 잠실 키즈카페\n#PLATFORM: BLOG\n#KIND: 원본\n...\n제목: ...\n\n본문:\n..."}'

# 배포 (prd 시 사용자 확인)
supabase functions deploy hook-intake
```

---

## 4. Hook 엔드포인트 운영

### 새 캠페인용 Hook URL 생성

PostingHub UI 의 `/dashboard/import` → "Hook 엔드포인트" 섹션에서 생성.

내부적으로:
1. `hooks` 테이블에 `url_token` (랜덤 16 chars) insert
2. 호출 URL: `https://<project>.supabase.co/functions/v1/hook-intake?t=<url_token>`
3. 캠페인 detail 에서 "Claude 용 Prompt" 와 함께 보임

### Claude Scheduled Tasks 설정

Claude 대시보드에서:
- URL: 위에서 만든 `?t=<url_token>` URL
- Method: POST
- Headers: 비워둠 (url token 으로 인증)
- Body: `application/json` `{ "raw": "<Claude 결과>" }`

또는 Bearer 인증을 쓰려면:
- Header: `Authorization: Bearer <HOOK_SHARED_SECRET>`
- Body: `{ "ownerId": "<auth.uid()>", "raw": "..." }`

### Hook 시크릿 회전 (위험 작업 — 사용자 확인 필수)

1. Doppler 에서 `HOOK_SHARED_SECRET` 새 값으로 업데이트.
2. Edge Function 재배포: `supabase functions deploy hook-intake`.
3. **Claude Scheduled Tasks 의 인증 헤더도 같은 시점에 갱신** — 한쪽만 바꾸면 결과 유실.

---

## 5. 배포 (Phase 4 이후)

권장 stack: **Vercel** (또는 Cloudflare Pages).

```bash
# Vercel
vercel link
vercel env add VITE_PUBLIC_SUPABASE_URL production
vercel env add VITE_PUBLIC_SUPABASE_ANON_KEY production
vercel deploy --prod
```

자세한 빌드 설정은 `vite build` 가 그대로 `dist/` 에 떨굼.

---

## 6. 백업 / 복구

### DB 백업
```bash
# 로컬
supabase db dump > backups/$(date +%Y%m%d).sql

# Cloud
supabase db dump --linked > backups/prd-$(date +%Y%m%d).sql
```

### 시크릿 백업
Doppler 자체가 SSOT 다 — 별도 백업 불필요. 단, **삭제 직전에 dashboard 에서 export** 권장.

---

## 7. 운영 체크리스트

- [ ] Doppler `postinghub` 프로젝트 — dev/stg/prd 모두 존재
- [ ] Supabase 프로젝트 — `0001_init.sql` + `0002_seed_variant_presets.sql` 적용
- [ ] `variant_presets` 5건 seed 확인
- [ ] Edge Function `hook-intake` 배포
- [ ] `HOOK_SHARED_SECRET` Doppler 등록
- [ ] 로그인 → /dashboard 진입 확인
- [ ] Claude → Hook URL POST 시 intake_events insert 확인
