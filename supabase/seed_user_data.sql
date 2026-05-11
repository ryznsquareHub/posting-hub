-- PostingHub — 첫 사용자 (creative.field666@gmail.com) 의 sample 데이터
-- owner_id: 72df2f16-c375-4794-b1fe-1a4299010f14
-- 자동 실행: Management API /v1/projects/{ref}/database/query

-- ── Campaigns 8 ──────────────────────────────────────────────────────────
insert into public.campaigns
  (id, owner_id, name, region, industry, color, client_note, brand, platforms, cta, tone, audience, keywords, active_variant_id, started_at)
values
  ('c_jamsil_kids',   '72df2f16-c375-4794-b1fe-1a4299010f14', '잠실 키즈카페',     '서울 · 잠실', '육아',     '#f5a524', '주말 만석, 평일 노출 강화', '잠실 키즈존',     ARRAY['NAVER_BLOG','NAVER_CAFE'], '주말 예약 필수 · 카카오톡 채널', '친근 · 솔직 · 직장맘 톤',    '30대 직장맘',         ARRAY['잠실 키즈카페','송파 키즈카페','주말 키즈카페','직장맘'], 'mom_cafe',     '2026-04-21'),
  ('c_gangnam_hair',  '72df2f16-c375-4794-b1fe-1a4299010f14', '강남역 1인 미용실', '서울 · 강남', '미용',     '#e2654a', '컷펌 8만원 프로모션',     '강남역 1인 미용실', ARRAY['NAVER_BLOG','NAVER_CAFE'], '예약 010-XXXX-XXXX · 컷펌 8만 프로모션', '20-30대 여성 / 솔직', '강남 직장인 여성',     ARRAY['강남 미용실','강남역 1인샵','컷펌','디자이너'],          'blog_seo',     '2026-04-12'),
  ('c_cheongju_ob',   '72df2f16-c375-4794-b1fe-1a4299010f14', '청주 산부인과',     '충북 · 청주', '의료',     '#5e80f5', '초진 예약 확보',          '청주 산부인과',   ARRAY['NAVER_BLOG','NAVER_CAFE'], '초진 예약 · 국민행복카드',          '차분 · 의료광고법 준수 · 단정 표현 금지', '임신초기 산모',  ARRAY['청주 산부인과','오송 산부인과','임신초기검진'],           'experience',   '2026-04-30'),
  ('c_suwon_food',    '72df2f16-c375-4794-b1fe-1a4299010f14', '수원 인계 맛집',    '경기 · 수원', 'F&B',      '#3acc81', '주말 디너 노출',          '인계동 다이닝',   ARRAY['NAVER_BLOG','NAVER_CAFE'], '예약 네이버 톡톡 · 단체석 가능',     '친근 · 데이트/회식 양쪽',    '수원 직장인',         ARRAY['수원 맛집','인계동 맛집','수원 데이트'],                  'blog_seo',     '2026-05-02'),
  ('c_bundang_bake',  '72df2f16-c375-4794-b1fe-1a4299010f14', '분당 베이커리',     '경기 · 분당', 'F&B',      '#a385ff', '신상 메뉴 4종',           '메종드빵',        ARRAY['NAVER_BLOG'],             '카카오톡 채널 @maisondppang',        '감성 · 사진 위주',           '분당 30-40대',        ARRAY['분당 카페','정자동 베이커리','신상카페'],                  'blog_seo',     '2026-05-04'),
  ('c_yeoksam_pt',    '72df2f16-c375-4794-b1fe-1a4299010f14', '역삼 PT스튜디오',   '서울 · 역삼', '헬스/PT',  '#6e7af0', '체험 1회 무료',           '역삼 PT스튜디오', ARRAY['NAVER_BLOG','NAVER_CAFE'], '체험 1회 무료',                      '직장인 타겟 · 가격 비교형',   '역삼 직장인',         ARRAY['역삼 PT','강남 헬스장','1:1 PT'],                          'blog_seo',     '2026-04-26'),
  ('c_magok_dental',  '72df2f16-c375-4794-b1fe-1a4299010f14', '마곡 치과',         '서울 · 마곡', '의료',     '#43c7c2', '임플란트 견적 비교',      '마곡 치과',       ARRAY['NAVER_BLOG','NAVER_CAFE'], '상담 02-XXXX-XXXX',                  '의료광고법 준수 · 견적 비교', '강서구 30-50대',       ARRAY['마곡 치과','강서 임플란트','마곡 임플란트'],                'blog_seo',     '2026-04-18'),
  ('c_haeundae_stay', '72df2f16-c375-4794-b1fe-1a4299010f14', '해운대 펜션',       '부산 · 해운대','여행',     '#f06da5', '비수기 30% 할인',         '해운대 오션펜션', ARRAY['NAVER_BLOG','NAVER_CAFE'], '비수기 30% 할인',                    '여행 감성 · 가성비',          '20-30대 커플/가족',    ARRAY['부산 펜션','해운대 펜션','오션뷰'],                        'blog_seo',     '2026-05-01')
on conflict (id) do nothing;

-- ── Campaign variants (M:N) ──────────────────────────────────────────────
insert into public.campaign_variants (campaign_id, variant_id) values
  ('c_jamsil_kids',   'blog_seo'),
  ('c_jamsil_kids',   'cafe_review'),
  ('c_jamsil_kids',   'mom_cafe'),
  ('c_jamsil_kids',   'short_review'),
  ('c_gangnam_hair',  'blog_seo'),
  ('c_gangnam_hair',  'cafe_review'),
  ('c_gangnam_hair',  'experience'),
  ('c_cheongju_ob',   'blog_seo'),
  ('c_cheongju_ob',   'mom_cafe'),
  ('c_cheongju_ob',   'experience'),
  ('c_suwon_food',    'blog_seo'),
  ('c_suwon_food',    'cafe_review'),
  ('c_suwon_food',    'mom_cafe'),
  ('c_suwon_food',    'short_review'),
  ('c_bundang_bake',  'blog_seo'),
  ('c_bundang_bake',  'experience'),
  ('c_yeoksam_pt',    'blog_seo'),
  ('c_yeoksam_pt',    'cafe_review'),
  ('c_magok_dental',  'blog_seo'),
  ('c_magok_dental',  'experience'),
  ('c_haeundae_stay', 'blog_seo'),
  ('c_haeundae_stay', 'cafe_review'),
  ('c_haeundae_stay', 'short_review')
on conflict (campaign_id, variant_id) do nothing;

-- ── Posts 12 ────────────────────────────────────────────────────────────
insert into public.posts
  (id, owner_id, campaign_id, title, body, platform, kind, keywords, region, industry, cta, memo, status, copy_count, recyclable, scheduled_at, created_at)
values
  ('p_001', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_gangnam_hair',  '강남역 1인 미용실 추천 + 컷펌 솔직 후기 (가격, 위치, 예약방법)',
    E'안녕하세요 :) 오늘은 강남역 근처 1인 미용실을 다녀온 후기를 자세히 적어보려 해요.\n\n평소에 큰 미용실은 좀 부담스러웠는데, 1:1로 상담받으면서 진행하니까 훨씬 편하더라고요.\n\n▶ 위치 / 접근성\n강남역 11번 출구에서 도보 3분.\n\n▶ 시술 — 컷 + 매직펌\n가격은 컷+매직펌 + 클리닉까지 해서 18만원이었습니다.\n\n▶ 솔직 후기\n재방문 의사 100%!\n\n#강남미용실 #강남역미용실 #1인미용실 #컷펌후기',
    'NAVER_BLOG', 'original', ARRAY['강남 미용실','1인샵','컷펌'], '서울 · 강남', '미용', '예약문의 010-XXXX-XXXX', '샴푸 브랜드 한 번 더 강조 필요', 'ready', 0, false, null, '2026-05-11T09:14:00+00'),
  ('p_002', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_gangnam_hair',  '강남 미용실 컷펌 후기 (맘카페 공유용)',
    E'강남 1인 미용실 다녀와서 후기 공유합니다 :)\n시간 없는 직장인 맘들께 진짜 추천이에요.\n컷 + 매직 + 클리닉 18만 (지금 프로모션 가격)\n예약 문의는 010-XXXX-XXXX',
    'NAVER_CAFE', 'variant', ARRAY['강남 미용실','맘카페 추천','컷펌'], '서울 · 강남', '미용', '예약문의 010-XXXX-XXXX', '강남맘카페 / 직장인맘 동시 발행 예정', 'ready', 0, false, null, '2026-05-11T09:16:00+00'),
  ('p_003', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_bundang_bake',  '분당 정자동 신상 베이커리 카페 ''메종드빵'' 다녀온 후기',
    E'정자동에 새로 오픈한 베이커리 카페 다녀왔어요!\n\n▶ 시그니처 — 솔티 카라멜 크루아상 6,500원\n▶ 음료 — 드립 5,500 / 아이스라떼 5,800\n\n#분당카페 #정자동카페 #메종드빵',
    'NAVER_BLOG', 'original', ARRAY['분당 카페','정자동 베이커리','신상카페'], '경기 · 분당', 'F&B', '카카오톡 채널 @maisondppang', null, 'ready', 0, false, null, '2026-05-11T08:42:00+00'),
  ('p_004', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_yeoksam_pt',    '역삼동 헬스장 PT 가격 비교 (3곳 직접 등록 후기)',
    E'직장인 맘 카페에 PT 가격 정보 공유드려요. A 65,000 / B 58,000 / C 72,000.\n저는 B에 등록.',
    'NAVER_CAFE', 'original', ARRAY['역삼 헬스장','역삼 PT','강남 헬스장'], '서울 · 역삼', '헬스/PT', '무료 체험 1회 신청', '강남 카페 / 직장인맘 카페 동시 발행함', 'published', 2, true, null, '2026-05-11T07:30:00+00'),
  ('p_005', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_cheongju_ob',   '잠실 산부인과 추천! 임신초기 검진 후기 + 비용 정리',
    E'잠실 산부인과 초진 후기.\n초음파+혈액검사+상담 8만원대, 국민행복카드 가능.',
    'NAVER_BLOG', 'original', ARRAY['잠실 산부인과','임신초기검진','송파 산부인과'], '서울 · 잠실', '의료', '초진 예약 02-XXX-XXXX', '이미지 3장 첨부 예정', 'scheduled', 0, false, '2026-05-12T10:00:00+00', '2026-05-10T22:11:00+00'),
  ('p_006', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_cheongju_ob',   '청주 오송 산부인과 검진 후기 + 비용 정리',
    E'오송쪽 산부인과 다녀온 첫 검진 후기. 초음파 약 3만원대.',
    'NAVER_BLOG', 'original', ARRAY['청주 산부인과','오송 산부인과','청주 임산부'], '충북 · 청주', '의료', '초진 예약 가능', null, 'draft', 0, false, null, '2026-05-08T10:40:00+00'),
  ('p_007', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_suwon_food',    '수원 인계동 맛집 BEST 5 — 현지인이 진짜 가는 곳',
    E'수원 토박이가 정리한 인계동 진짜 맛집 5곳.',
    'NAVER_BLOG', 'original', ARRAY['수원 맛집','인계동 맛집','수원 데이트'], '경기 · 수원', 'F&B', '예약은 네이버 톡톡', '지도 캡처 5장 본문 삽입 자리', 'ready', 0, false, null, '2026-05-10T20:05:00+00'),
  ('p_008', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_suwon_food',    '수원 인계 맛집 — 데이트용 BEST 3 (맘카페 추천판)',
    E'수원 데이트 코스로 좋은 인계동 맛집 3곳만 골라봤어요 :)',
    'NAVER_CAFE', 'variant', ARRAY['수원 맛집','수원 데이트','인계동'], '경기 · 수원', 'F&B', '예약 네이버 톡톡', '맘카페 톤으로 변형', 'draft', 0, false, null, '2026-05-10T20:10:00+00'),
  ('p_009', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_jamsil_kids',   '송파 잠실 키즈카페 후기 (만 3세, 6세 함께 가기 좋은 곳)',
    E'두 아이 데리고 다녀온 잠실 키즈카페 후기. 입장료 평일 28,000 / 주말 35,000.',
    'NAVER_BLOG', 'original', ARRAY['잠실 키즈카페','송파 키즈카페','유아 놀이공간'], '서울 · 송파', '육아', '주말 예약 필수', '재발행 — 주말 후기 추가', 'published', 4, true, null, '2026-05-10T14:20:00+00'),
  ('p_010', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_jamsil_kids',   '잠실 키즈카페 추천 — 직장인맘 주말 활용 팁',
    E'주말에 잠실 키즈카페 다녀온 후기 + 예약 꿀팁 정리.',
    'NAVER_CAFE', 'variant', ARRAY['잠실 키즈카페','주말 키즈카페','직장맘'], '서울 · 송파', '육아', '주말 예약 필수', null, 'ready', 0, false, null, '2026-05-10T14:30:00+00'),
  ('p_011', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_jamsil_kids',   '잠실 키즈카페 평일 가성비 후기 (재활용 가능)',
    E'평일 오후 잠실 키즈카페 후기. 한가하고 가성비 좋아요.',
    'NAVER_BLOG', 'recycled', ARRAY['잠실 키즈카페','평일 키즈카페','가성비'], '서울 · 송파', '육아', '평일 30% 할인', '성과 좋음 — 다른 지역으로 변형 검토', 'published', 7, true, null, '2026-04-22T10:00:00+00'),
  ('p_012', '72df2f16-c375-4794-b1fe-1a4299010f14', 'c_magok_dental',  '강서구 마곡 치과 추천, 임플란트 가격 알아본 후기',
    E'마곡 치과 임플란트 견적 3군데 비교 후기. A 110 / B 95 / C 120.',
    'NAVER_BLOG', 'original', ARRAY['마곡 치과','강서구 임플란트','마곡 임플란트'], '서울 · 마곡', '의료', '상담 02-XXXX-XXXX', null, 'ready', 1, false, null, '2026-05-10T11:55:00+00')
on conflict (id) do nothing;

-- ── Sample prompts (Prompt Library) 3 ─────────────────────────────────────
insert into public.prompts
  (id, owner_id, name, category, platform, description, variables, output_format, body, webhook_enabled, auto_parse, schedule, uses, last_run_at, last_run_status)
values
  ('pr1', '72df2f16-c375-4794-b1fe-1a4299010f14', '키즈카페 후기형',     '육아',     'NAVER_BLOG', '키즈카페 방문 후기. 친근 톤·3~6단락·해시태그 5개 미만.', ARRAY['campaign','cta','child_age'], '#CAMPAIGN: ...', '키즈카페 후기 prompt 본문', true, true, '매일 08:30', 34, '2026-05-11T08:30:00+00', 'ok'),
  ('pr2', '72df2f16-c375-4794-b1fe-1a4299010f14', '지역맘카페 홍보형',  '맘카페',   'NAVER_CAFE', '맘카페 회원 톤. 과장 광고 금지·후기 위주·짧은 단락.',     ARRAY['campaign','cta','keywords'],  '#CAMPAIGN: ...', '지역맘카페 prompt 본문',  true, true, '매일 09:00', 28, '2026-05-11T09:01:00+00', 'ok'),
  ('pr3', '72df2f16-c375-4794-b1fe-1a4299010f14', '블로그 SEO형 (지역+업종)', 'SEO', 'NAVER_BLOG', '키워드 4~6회 배치·첫 문단에 지역+업종 키워드 명시·H2 3개.', ARRAY['region','industry','keywords'], '#CAMPAIGN: ...', '블로그 SEO prompt 본문',  true, true, '매일 07:00', 51, '2026-05-11T07:02:00+00', 'ok')
on conflict (id) do nothing;

-- 확인용 카운트
select 'campaigns' as t, count(*) as n from public.campaigns
union all select 'campaign_variants', count(*) from public.campaign_variants
union all select 'posts', count(*) from public.posts
union all select 'prompts', count(*) from public.prompts;
