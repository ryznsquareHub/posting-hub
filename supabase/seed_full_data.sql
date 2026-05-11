-- PostingHub — 사용자 데이터 풀 seed (Phase 2-b)
-- owner_id: 72df2f16-c375-4794-b1fe-1a4299010f14
-- 멱등성: on conflict do nothing — 여러 번 실행 안전.

-- ── Templates 6 ────────────────────────────────────────────────────────
insert into public.templates (id, owner_id, platform, name, uses, updated_at) values
  ('t1', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_BLOG', '지역 + 업종 후기 (기본)',       142, '2026-05-09'),
  ('t2', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_BLOG', '가격 비교 정리형',                 87, '2026-05-09'),
  ('t3', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_BLOG', '데이트 / 가족 방문 후기',           64, '2026-05-07'),
  ('t4', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_CAFE', '카페 정보 공유형 (질문 답변)',     121, '2026-05-09'),
  ('t5', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_CAFE', '맘카페 가성비 추천형',              56, '2026-05-05'),
  ('t6', '72df2f16-c375-4794-b1fe-1a4299010f14', 'NAVER_BLOG', '임플란트 · 의료 후기',              33, '2026-05-02')
on conflict (id) do nothing;

-- ── Prompts: 기존 3개 update + 새 3개 insert (총 6개) ─────────────────
update public.prompts set
  output_format = E'#CAMPAIGN: {campaign}\n#PLATFORM: BLOG|CAFE\n#KIND: 원본|변형|재활용\n#KEYWORDS: kw1, kw2, kw3\n#REGION: ...\n#INDUSTRY: ...\n#CTA: ...\n\n제목: ...\n\n본문:\n...',
  body = case id
    when 'pr1' then E'너는 한국 네이버 블로그 후기 작성자다.\n다음 정보를 받아 키즈카페 방문 후기 한 편을 작성한다.\n\n출력 형식:\n#CAMPAIGN: {campaign}\n#PLATFORM: BLOG\n#KIND: 원본\n#CTA: {cta}\n\n제목: ...\n\n본문:\n...\n\n톤: 친근, 솔직, 3-6단락, 해시태그 5개 미만.'
    when 'pr2' then E'너는 지역 맘카페 회원처럼 정보를 공유한다.\n과장된 광고 톤 금지, 후기 위주.\n\n출력 형식:\n#CAMPAIGN: ...\n#PLATFORM: CAFE\n#CTA: ...\n\n제목: ...\n\n본문:\n...'
    when 'pr3' then E'SEO 블로그 글 작성. 키워드 자연스럽게 4-6회 배치, 첫 문단에 지역+업종 키워드 명시.\n\n출력 형식:\n#CAMPAIGN: ...\n#PLATFORM: BLOG\n#KIND: 원본\n#CTA: ...\n\n제목: ...\n\n본문:\n...'
    else body
  end,
  last_run_count = case id when 'pr1' then 6 when 'pr2' then 3 when 'pr3' then 8 else last_run_count end,
  success_rate   = case id when 'pr1' then 0.96 when 'pr2' then 1.0 when 'pr3' then 0.92 else success_rate end
where owner_id = '72df2f16-c375-4794-b1fe-1a4299010f14';

insert into public.prompts
  (id, owner_id, name, category, platform, description, variables, output_format, body,
   webhook_enabled, auto_parse, schedule, uses, last_run_at, last_run_status, last_run_count, success_rate)
values
  ('pr4', '72df2f16-c375-4794-b1fe-1a4299010f14', '체험단 스타일',           '체험단', 'NAVER_BLOG',
    '체험단 후기 톤. 긍정 70% + 작은 단점 1개.', ARRAY['product','cta'],
    E'#CAMPAIGN: ...\n#PLATFORM: BLOG\n#KIND: 원본\n#CTA: ...\n\n제목: ...\n본문: ...',
    E'체험단 후기 톤. 솔직하지만 긍정 70%, 작은 단점도 1개 언급.\n\n출력 형식: #CAMPAIGN/#PLATFORM/#CTA + 제목/본문',
    false, true, null, 19, '2026-05-06T11:20:00+00', 'manual', 0, 0.88),
  ('pr5', '72df2f16-c375-4794-b1fe-1a4299010f14', '의료 후기형 (광고 가이드)', '의료',   'NAVER_BLOG',
    '의료광고법 준수. 효능 단정 금지·개인 경험만 서술.', ARRAY['clinic','cta'],
    E'#CAMPAIGN: ...\n#PLATFORM: BLOG\n#CTA: ...\n\n제목: ...\n본문: ...',
    E'의료 광고 가이드 준수. 효능 단정 금지, 개인 경험만 서술.',
    true,  false, '수동',     12, '2026-05-10T22:00:00+00', 'review', 2, 0.75),
  ('pr6', '72df2f16-c375-4794-b1fe-1a4299010f14', '가성비 비교형',            '리뷰',   'NAVER_CAFE',
    '3~5곳 비교 · 가격/접근성/만족도 표 형태.', ARRAY['targets','metric'],
    E'#CAMPAIGN: ...\n#PLATFORM: CAFE\n#CTA: ...\n\n제목: ...\n본문: ...',
    E'3-5곳 비교, 가격/접근성/만족도 표 형태.',
    true,  true,  '격일 10:00', 24, '2026-05-10T10:05:00+00', 'ok',    4, 0.94)
on conflict (id) do nothing;

-- ── Hooks 2 ────────────────────────────────────────────────────────────
insert into public.hooks
  (id, owner_id, name, url_token, url, protocol, status, auth_type, bound_prompts,
   uptime, last_ping_at, secret, received_today, errors_today, p50_latency_ms)
values
  ('hk_default', '72df2f16-c375-4794-b1fe-1a4299010f14', 'Claude Scheduled · 기본 엔드포인트',
    'c8f4e2a1', 'https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake?t=c8f4e2a1',
    'POST · JSON', 'live', 'Bearer', ARRAY['pr1','pr2','pr3','pr6'],
    0.998, '2026-05-11T09:12:14+00', 'phk_•••••••••••••e2a1', 14, 1, 312),
  ('hk_review',  '72df2f16-c375-4794-b1fe-1a4299010f14', '의료 후기 · 수동 승인 엔드포인트',
    'medical-9d2f', 'https://ovdefrvxjblkiewempug.supabase.co/functions/v1/hook-intake?t=medical-9d2f',
    'POST · JSON', 'review', 'Bearer', ARRAY['pr5'],
    1.0, '2026-05-10T22:00:11+00', 'phk_•••••••••••••9d2f', 0, 0, 401)
on conflict (id) do nothing;

-- ── Intake events 10 ──────────────────────────────────────────────────
insert into public.intake_events
  (id, owner_id, source, hook_id, prompt_id, prompt_name, title, campaign_id, campaign_matched,
   platform, parse_status, warnings, queued, latency_ms, at)
values
  ('in_021', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr2', '지역맘카페 홍보형',
    '잠실 키즈카페 평일 가성비 후기 (직장맘 추천)', 'c_jamsil_kids', '잠실 키즈카페',
    'NAVER_CAFE', 'ok',    ARRAY[]::text[], true, 340, '2026-05-11T09:12:14+00'),
  ('in_020', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr1', '키즈카페 후기형',
    '잠실에서 진짜 만족했던 키즈카페 후기 (주말 가족 외출)', 'c_jamsil_kids', '잠실 키즈카페',
    'NAVER_BLOG', 'ok',    ARRAY[]::text[], true, 298, '2026-05-11T09:11:48+00'),
  ('in_019', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr2', '지역맘카페 홍보형',
    '수원 인계 맛집 데이트 코스 3곳 (직장맘 추천)', 'c_suwon_food', '수원 인계 맛집',
    'NAVER_CAFE', 'ok',    ARRAY[]::text[], true, 412, '2026-05-11T09:01:11+00'),
  ('in_018', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr3', '블로그 SEO형 (지역+업종)',
    '강남 1인 미용실 솔직 후기 — 컷펌 가격 비교', 'c_gangnam_hair', '강남역 1인 미용실',
    'NAVER_BLOG', 'ok',    ARRAY[]::text[], true, 267, '2026-05-11T08:30:09+00'),
  ('in_017', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr3', '블로그 SEO형 (지역+업종)',
    '분당 정자동 신상 베이커리 추천 BEST 3', 'c_bundang_bake', '분당 베이커리',
    'NAVER_BLOG', 'warn',  ARRAY['#CTA 누락'], true, 301, '2026-05-11T08:30:05+00'),
  ('in_016', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr3', '블로그 SEO형 (지역+업종)',
    '역삼 PT스튜디오 체험 후기 (직장인 BEST)', 'c_yeoksam_pt', '역삼 PT스튜디오',
    'NAVER_BLOG', 'ok',    ARRAY[]::text[], true, 284, '2026-05-11T08:30:01+00'),
  ('in_015', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr6', '가성비 비교형',
    '마곡 치과 임플란트 가격 3곳 비교', 'c_magok_dental', '마곡 치과',
    'NAVER_CAFE', 'ok',    ARRAY[]::text[], true, 368, '2026-05-11T07:48:02+00'),
  ('in_014', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr3', '블로그 SEO형 (지역+업종)',
    '(파싱 실패) 청주 산부인과 — 본문 누락', 'c_cheongju_ob', '청주 산부인과',
    'NAVER_BLOG', 'error', ARRAY['본문 누락','#KIND 누락'], false, 412, '2026-05-11T07:00:31+00'),
  ('in_013', '72df2f16-c375-4794-b1fe-1a4299010f14', 'manual', null,         null,  '수동 paste',
    '해운대 펜션 5곳 오션뷰 비교', 'c_haeundae_stay', '해운대 펜션',
    'NAVER_BLOG', 'ok',    ARRAY[]::text[], true, 0,   '2026-05-10T22:14:08+00'),
  ('in_010', '72df2f16-c375-4794-b1fe-1a4299010f14', 'hook',   'hk_default', 'pr1', '키즈카페 후기형',
    '잠실 키즈카페 주말 후기 (가족 6인)', 'c_jamsil_kids', '잠실 키즈카페',
    'NAVER_BLOG', 'ok',    ARRAY[]::text[], true, 289, '2026-05-10T09:00:14+00')
on conflict (owner_id, raw_hash) do nothing;
-- 위 intake_events 는 raw_hash 없는데 unique constraint 가 (owner_id, raw_hash) — null 은 unique 충돌 안 함.
-- 그래서 그냥 insert 가 되고 멱등성은 id pk 가 책임.

-- ── Imports 4 (batch 이력) ─────────────────────────────────────────────
insert into public.imports
  (id, owner_id, at, source, source_name, count, parsed, status, summary)
values
  ('i1', '72df2f16-c375-4794-b1fe-1a4299010f14', '2026-05-11T09:12:14+00', 'hook',   'Claude · Webhook (실시간)',         7, 6, 'applied', '8 prompts active · 1 warn'),
  ('i2', '72df2f16-c375-4794-b1fe-1a4299010f14', '2026-05-11T08:30:09+00', 'hook',   'Claude Scheduled · 08:30 일배치',   4, 3, 'partial', '1 error · 본문 누락'),
  ('i3', '72df2f16-c375-4794-b1fe-1a4299010f14', '2026-05-10T22:14:08+00', 'manual', 'Manual paste · 정수민',              3, 3, 'applied', '오프라인 백업'),
  ('i4', '72df2f16-c375-4794-b1fe-1a4299010f14', '2026-05-10T09:00:14+00', 'hook',   'Claude Scheduled · 09:00 일배치',   5, 5, 'applied', '')
on conflict (id) do nothing;

-- 확인용 카운트
select 'campaigns' as t, count(*)::text as n from public.campaigns where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'campaign_variants', count(*)::text from public.campaign_variants cv join public.campaigns c on c.id=cv.campaign_id where c.owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'posts', count(*)::text from public.posts where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'prompts', count(*)::text from public.prompts where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'templates', count(*)::text from public.templates where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'hooks', count(*)::text from public.hooks where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'intake_events', count(*)::text from public.intake_events where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14'
union all select 'imports', count(*)::text from public.imports where owner_id='72df2f16-c375-4794-b1fe-1a4299010f14';
