# PostingHub — Cloud SaaS Setup

> 로컬 / Docker 사용 안 함. 모든 인프라가 cloud SaaS.
> 이 문서는 현재 상태 (✅ 완료 / ⏳ 다음 단계) 를 함께 기록.

---

## 1. Supabase Cloud — ✅ 완료

| 항목 | 상태 |
|---|---|
| Project `postinghub` (ref `ovdefrvxjblkiewempug`) | ✅ |
| Schema (8 테이블 + 17 RLS 정책) — migrations 0001~0003 | ✅ |
| variant_presets seed 5 rows + 사용자 seed (8 캠페인 / 12 글 등) | ✅ |
| Auth Email Magic Link + `mailer_autoconfirm: true` | ✅ |
| `site_url`, `redirect_urls` 로컬 (`localhost:5173`) | ✅ |
| Founder user (`creative.field666@gmail.com`) + password | ✅ |
| Edge Function `hook-intake` 배포 | ⏳ **미배포** — Claude 자동 흐름 차단 (P0) |

**남은 사용자 작업**:
- Edge Function 배포 시 Supabase CLI 또는 Dashboard 의 Function 메뉴에서 manual upload (Phase 4)
- production domain 추가 (Vercel 배포 후 `site_url` / `uri_allow_list` 갱신 — 내가 자동)

---

## 2. Doppler Cloud — ✅ 사용 중

사용자가 직접 셋업 완료. MCP 토큰에 `postinghub` 접근 권한 부여됨.

**dev config 에 들어있는 키** (현재 `.env.local` 과 동일):
- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOOK_SHARED_SECRET`
- `VITE_PUBLIC_AUTO_SIGNIN_EMAIL` (D-008)
- `VITE_PUBLIC_AUTO_SIGNIN_PASSWORD` (D-008)

**매일 개발**:
```bash
doppler run --project postinghub --config dev -- npm run dev
# 또는
npm run env:pull && npm run dev    # .env.local 동기화
```

**production 환경 (Vercel)** — `prd` config 별도. Vercel 의 env 에 prod 값 직접 또는 Doppler integration 사용 (§4 참조).

---

## 3. Git + GitHub — ⏳ 다음 단계

```bash
cd D:/2026_workspace/PostingHub
git init
git add .
git commit -m "초기 커밋 — Phase 0~3 + Cloud DB 연동"
# GitHub repo 생성 후
git remote add origin https://github.com/<user>/postinghub.git
git branch -M main
git push -u origin main
```

`.gitignore` 가 `.env.local`, `node_modules`, `dist`, `.design-package` 등 처리됨. 안전.

---

## 4. Vercel 배포 — ⏳ 다음 단계

### 4-1. Vercel CLI 로 빠르게
```bash
cd D:/2026_workspace/PostingHub
vercel login                         # 브라우저 OAuth (한 번)
vercel link                          # 새 프로젝트 생성 또는 기존 연결
vercel env add VITE_PUBLIC_SUPABASE_URL production
vercel env add VITE_PUBLIC_SUPABASE_ANON_KEY production
vercel env add VITE_PUBLIC_AUTO_SIGNIN_EMAIL production
vercel env add VITE_PUBLIC_AUTO_SIGNIN_PASSWORD production
vercel deploy --prod
```

응답에 `https://<project>-<hash>.vercel.app` URL.

### 4-2. 또는 GitHub 연동
- vercel.com → Add New → Project → GitHub repo 선택
- Build Command: 자동 (Vite detect)
- Output Dir: `dist`
- Env vars: 위 4개 모두 Production 에 추가

### 4-3. 배포 직후 Supabase Auth URL 갱신
배포 도메인 (`https://posting-hub-xxx.vercel.app`) 을 Supabase 의 Site URL / Redirect URLs 에 추가:

내가 Management API 로 자동 추가 가능:
```bash
PAT=...
curl -X PATCH "https://api.supabase.com/v1/projects/ovdefrvxjblkiewempug/config/auth" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "https://posting-hub.vercel.app",
    "uri_allow_list": "https://posting-hub.vercel.app,https://posting-hub.vercel.app/auth-callback,http://localhost:5173,http://localhost:5173/auth-callback"
  }'
```

---

## 5. Edge Function `hook-intake` 배포 — ⏳ Phase 4

Supabase CLI 가 설치된 환경에서:
```bash
supabase login                       # OAuth
supabase link --project-ref ovdefrvxjblkiewempug
supabase functions deploy hook-intake --no-verify-jwt
supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY=eyJh... \
  HOOK_SHARED_SECRET=phk_dev_... \
  --project-ref ovdefrvxjblkiewempug
```

CLI 없으면 Supabase Dashboard → Functions → Deploy via manual upload (zip).

배포 후 URL: `https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake`

---

## 6. 운영 체크리스트

- [x] Supabase Cloud 프로젝트 + schema + seed
- [x] Auth Email Magic Link + autoconfirm
- [x] Founder user + password
- [x] Doppler postinghub/dev 4 secrets + MCP 접근 권한
- [x] `.env.local` 또는 Doppler 로 dev 실행
- [x] D-008 자동 sign-in 적용 → `/login` 우회
- [ ] Git init + GitHub push
- [ ] Vercel 프로젝트 + production env
- [ ] 배포 후 Supabase Auth URL 갱신 (자동 가능)
- [ ] Edge Function `hook-intake` 배포 (P0 → Claude 자동 흐름)
- [ ] PAT / service_role 회전 (보안)
