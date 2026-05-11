/**
 * Phase 1 mock seed — Supabase 연동 전.
 * 디자인 패키지 data.js 의 핵심 부분만 TypeScript 로 옮김.
 * Phase 2 진입 시 이 파일은 삭제, src/lib/api/* + Supabase 가 대체.
 */

import type { Campaign, VariantPreset } from "@/types/campaign";
import type { Post } from "@/types/post";
import type { Prompt, PostTemplate } from "@/types/prompt";
import type {
  IntakeEvent,
  ImportBatch,
  HookEndpoint,
} from "@/types/intake";

// ── Variant presets ─────────────────────────────────────────────────────
export const VARIANT_PRESETS: VariantPreset[] = [
  {
    id: "blog_seo",
    name: "블로그 SEO형",
    platform: "NAVER_BLOG",
    style: "키워드 4~6회 자연 배치 · 첫 문단에 지역+업종 명시 · H2 3개 · 본문 800자+",
    template: `너는 한국 네이버 블로그 SEO 작성자다.

[업체] {brand}
[지역] {region}
[업종] {industry}
[키워드] {keywords}
[CTA] {cta}
[톤] {tone}
[독자] {audience}

위 정보로 네이버 블로그 SEO 후기 글을 {batchSize}편 작성한다.
키워드는 4-6회 자연스럽게, 첫 문단에 지역+업종을 반드시 포함.
H2 헤딩 3개, 본문 800자 이상.

각 글은 아래 형식을 정확히 지킨다:

#CAMPAIGN: {brand}
#PLATFORM: BLOG
#KIND: 원본
#KEYWORDS: {keywords}
#REGION: {region}
#INDUSTRY: {industry}
#CTA: {cta}

제목: ...

본문:
...

글이 여러 개면 \`---\` 로 구분.`,
  },
  {
    id: "cafe_review",
    name: "카페 후기형",
    platform: "NAVER_CAFE",
    style: "회원 톤 · 짧은 문단 · 사진 자리 표시 · 광고티 제거",
    template: `너는 네이버 카페 회원이다. 광고가 아닌 정보 공유 톤으로 작성.

[업체] {brand}
[지역] {region}
[업종] {industry}
[CTA] {cta}
[톤] {tone}

{batchSize}편 작성. 짧은 문단, 사진 자리는 [사진] 표시.
과장 금지, 작은 단점 1개 자연스럽게 언급.

#CAMPAIGN: {brand}
#PLATFORM: CAFE
#KIND: 원본
#KEYWORDS: {keywords}
#REGION: {region}
#INDUSTRY: {industry}
#CTA: {cta}

제목: ...

본문:
...

여러 개면 \`---\` 로 구분.`,
  },
  {
    id: "mom_cafe",
    name: "맘카페 자연형",
    platform: "NAVER_CAFE",
    style: "맘카페 회원체 · 질문 → 답변형 · 광고 알레르기 회피",
    template: `너는 지역 맘카페에서 정보 공유하는 직장맘이다.

[업체] {brand}
[지역] {region}
[업종] {industry}
[CTA] {cta}
[독자] {audience}

질문 → 답변 톤으로 {batchSize}편 작성. 광고 느낌 절대 금지.
실제 다녀온 듯한 디테일(주차, 화장실, 키즈존 등).

#CAMPAIGN: {brand}
#PLATFORM: CAFE
#KIND: 원본
#KEYWORDS: {keywords}
#CTA: {cta}

제목: ...

본문:
...`,
  },
  {
    id: "experience",
    name: "체험단 스타일",
    platform: "NAVER_BLOG",
    style: "체험단 후기 톤 · 긍정 70% + 작은 단점 1개 · 사진 6장 위치 표시",
    template: `체험단 후기 톤. [업체] {brand} / [지역] {region}
[CTA] {cta} / [톤] {tone}

{batchSize}편 작성. 긍정 70%, 작은 단점 1개. [사진1]~[사진6] 위치 표시.

#CAMPAIGN: {brand}
#PLATFORM: BLOG
#KIND: 원본
#KEYWORDS: {keywords}
#CTA: {cta}

제목: ...

본문:
...`,
  },
  {
    id: "short_review",
    name: "짧은 후기형",
    platform: "NAVER_CAFE",
    style: "300자 내외 · 사진 1장 · 카페 댓글 톤",
    template: `짧은 후기. [업체] {brand} / [지역] {region} / [CTA] {cta}

{batchSize}개를 한 번에 작성. 각각 300자 내외, 사진 1장 위치만 [사진].

#CAMPAIGN: {brand}
#PLATFORM: CAFE
#KIND: 변형
#KEYWORDS: {keywords}
#CTA: {cta}

제목: ...

본문:
...`,
  },
];

// ── Campaigns ───────────────────────────────────────────────────────────
const RAW_CAMPAIGNS: Omit<Campaign, "variants">[] = [
  {
    id: "c_jamsil_kids",
    name: "잠실 키즈카페",
    region: "서울 · 잠실",
    industry: "육아",
    color: "#f5a524",
    clientNote: "주말 만석, 평일 노출 강화",
    startedAt: "2026-04-21",
    settings: {
      brand: "잠실 키즈존",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "주말 예약 필수 · 카카오톡 채널",
      tone: "친근 · 솔직 · 직장맘 톤",
      audience: "30대 직장맘",
      keywords: ["잠실 키즈카페", "송파 키즈카페", "주말 키즈카페", "직장맘"],
    },
    variantIds: ["blog_seo", "cafe_review", "mom_cafe", "short_review"],
    activeVariantId: "mom_cafe",
    hook: { connected: true, lastReceivedAt: "2026-05-11T09:12:14", receivedCount: 23, errorCount: 0 },
  },
  {
    id: "c_gangnam_hair",
    name: "강남역 1인 미용실",
    region: "서울 · 강남",
    industry: "미용",
    color: "#e2654a",
    clientNote: "컷펌 8만원 프로모션",
    startedAt: "2026-04-12",
    settings: {
      brand: "강남역 1인 미용실",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "예약 010-XXXX-XXXX · 컷펌 8만 프로모션",
      tone: "20-30대 여성 / 솔직",
      audience: "강남 직장인 여성",
      keywords: ["강남 미용실", "강남역 1인샵", "컷펌", "디자이너"],
    },
    variantIds: ["blog_seo", "cafe_review", "experience"],
    activeVariantId: "blog_seo",
    hook: { connected: true, lastReceivedAt: "2026-05-11T08:30:09", receivedCount: 18, errorCount: 0 },
  },
  {
    id: "c_cheongju_ob",
    name: "청주 산부인과",
    region: "충북 · 청주",
    industry: "의료",
    color: "#5e80f5",
    clientNote: "초진 예약 확보",
    startedAt: "2026-04-30",
    settings: {
      brand: "청주 산부인과",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "초진 예약 · 국민행복카드",
      tone: "차분 · 의료광고법 준수 · 단정 표현 금지",
      audience: "임신초기 산모",
      keywords: ["청주 산부인과", "오송 산부인과", "임신초기검진"],
    },
    variantIds: ["blog_seo", "mom_cafe", "experience"],
    activeVariantId: "experience",
    hook: { connected: true, lastReceivedAt: "2026-05-11T07:00:31", receivedCount: 6, errorCount: 1 },
  },
  {
    id: "c_suwon_food",
    name: "수원 인계 맛집",
    region: "경기 · 수원",
    industry: "F&B",
    color: "#3acc81",
    clientNote: "주말 디너 노출",
    startedAt: "2026-05-02",
    settings: {
      brand: "인계동 다이닝",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "예약 네이버 톡톡 · 단체석 가능",
      tone: "친근 · 데이트/회식 양쪽",
      audience: "수원 직장인",
      keywords: ["수원 맛집", "인계동 맛집", "수원 데이트"],
    },
    variantIds: ["blog_seo", "cafe_review", "mom_cafe", "short_review"],
    activeVariantId: "blog_seo",
    hook: { connected: true, lastReceivedAt: "2026-05-11T09:01:11", receivedCount: 11, errorCount: 0 },
  },
  {
    id: "c_bundang_bake",
    name: "분당 베이커리",
    region: "경기 · 분당",
    industry: "F&B",
    color: "#a385ff",
    clientNote: "신상 메뉴 4종",
    startedAt: "2026-05-04",
    settings: {
      brand: "메종드빵",
      platforms: ["NAVER_BLOG"],
      cta: "카카오톡 채널 @maisondppang",
      tone: "감성 · 사진 위주",
      audience: "분당 30-40대",
      keywords: ["분당 카페", "정자동 베이커리", "신상카페"],
    },
    variantIds: ["blog_seo", "experience"],
    activeVariantId: "blog_seo",
    hook: { connected: true, lastReceivedAt: "2026-05-11T08:30:05", receivedCount: 9, errorCount: 1 },
  },
  {
    id: "c_yeoksam_pt",
    name: "역삼 PT스튜디오",
    region: "서울 · 역삼",
    industry: "헬스/PT",
    color: "#6e7af0",
    clientNote: "체험 1회 무료",
    startedAt: "2026-04-26",
    settings: {
      brand: "역삼 PT스튜디오",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "체험 1회 무료",
      tone: "직장인 타겟 · 가격 비교형",
      audience: "역삼 직장인",
      keywords: ["역삼 PT", "강남 헬스장", "1:1 PT"],
    },
    variantIds: ["blog_seo", "cafe_review"],
    activeVariantId: "blog_seo",
    hook: { connected: true, lastReceivedAt: "2026-05-11T08:30:01", receivedCount: 7, errorCount: 0 },
  },
  {
    id: "c_magok_dental",
    name: "마곡 치과",
    region: "서울 · 마곡",
    industry: "의료",
    color: "#43c7c2",
    clientNote: "임플란트 견적 비교",
    startedAt: "2026-04-18",
    settings: {
      brand: "마곡 치과",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "상담 02-XXXX-XXXX",
      tone: "의료광고법 준수 · 견적 비교",
      audience: "강서구 30-50대",
      keywords: ["마곡 치과", "강서 임플란트", "마곡 임플란트"],
    },
    variantIds: ["blog_seo", "experience"],
    activeVariantId: "blog_seo",
    hook: { connected: false, lastReceivedAt: "2026-05-09T11:55:00", receivedCount: 3, errorCount: 0 },
  },
  {
    id: "c_haeundae_stay",
    name: "해운대 펜션",
    region: "부산 · 해운대",
    industry: "여행",
    color: "#f06da5",
    clientNote: "비수기 30% 할인",
    startedAt: "2026-05-01",
    settings: {
      brand: "해운대 오션펜션",
      platforms: ["NAVER_BLOG", "NAVER_CAFE"],
      cta: "비수기 30% 할인",
      tone: "여행 감성 · 가성비",
      audience: "20-30대 커플/가족",
      keywords: ["부산 펜션", "해운대 펜션", "오션뷰"],
    },
    variantIds: ["blog_seo", "cafe_review", "short_review"],
    activeVariantId: "blog_seo",
    hook: { connected: true, lastReceivedAt: "2026-05-10T22:14:08", receivedCount: 5, errorCount: 0 },
  },
];

export const CAMPAIGNS: Campaign[] = RAW_CAMPAIGNS.map((c) => ({
  ...c,
  variants: (c.variantIds ?? [])
    .map((vid) => VARIANT_PRESETS.find((v) => v.id === vid))
    .filter((v): v is VariantPreset => Boolean(v)),
}));

export function campaignById(id: string): Campaign | undefined {
  return CAMPAIGNS.find((c) => c.id === id);
}

// ── Posts ───────────────────────────────────────────────────────────────
export const POSTS_SEED: Post[] = [
  {
    id: "p_001",
    campaignId: "c_gangnam_hair",
    title: "강남역 1인 미용실 추천 + 컷펌 솔직 후기 (가격, 위치, 예약방법)",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["강남 미용실", "1인샵", "컷펌"],
    region: "서울 · 강남",
    industry: "미용",
    cta: "예약문의 010-XXXX-XXXX",
    createdAt: "2026-05-11T09:14:00",
    status: "ready",
    copyCount: 0,
    memo: "샴푸 브랜드 한 번 더 강조 필요",
    scheduledAt: null,
    recyclable: false,
    body: `안녕하세요 :) 오늘은 강남역 근처 1인 미용실을 다녀온 후기를 자세히 적어보려 해요.

평소에 큰 미용실은 좀 부담스러웠는데, 1:1로 상담받으면서 진행하니까 훨씬 편하더라고요.

▶ 위치 / 접근성
강남역 11번 출구에서 도보 3분.

▶ 시술 — 컷 + 매직펌
가격은 컷+매직펌 + 클리닉까지 해서 18만원이었습니다.

▶ 솔직 후기
재방문 의사 100%!

#강남미용실 #강남역미용실 #1인미용실 #컷펌후기`,
  },
  {
    id: "p_002",
    campaignId: "c_gangnam_hair",
    title: "강남 미용실 컷펌 후기 (맘카페 공유용)",
    platform: "NAVER_CAFE",
    kind: "variant",
    keywords: ["강남 미용실", "맘카페 추천", "컷펌"],
    region: "서울 · 강남",
    industry: "미용",
    cta: "예약문의 010-XXXX-XXXX",
    createdAt: "2026-05-11T09:16:00",
    status: "ready",
    copyCount: 0,
    memo: "강남맘카페 / 직장인맘 동시 발행 예정",
    scheduledAt: null,
    recyclable: false,
    body: `강남 1인 미용실 다녀와서 후기 공유합니다 :)
시간 없는 직장인 맘들께 진짜 추천이에요.
컷 + 매직 + 클리닉 18만 (지금 프로모션 가격)
예약 문의는 010-XXXX-XXXX`,
  },
  {
    id: "p_003",
    campaignId: "c_bundang_bake",
    title: "분당 정자동 신상 베이커리 카페 '메종드빵' 다녀온 후기",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["분당 카페", "정자동 베이커리", "신상카페"],
    region: "경기 · 분당",
    industry: "F&B",
    cta: "카카오톡 채널 @maisondppang",
    createdAt: "2026-05-11T08:42:00",
    status: "ready",
    copyCount: 0,
    scheduledAt: null,
    recyclable: false,
    body: `정자동에 새로 오픈한 베이커리 카페 다녀왔어요!

▶ 시그니처 — 솔티 카라멜 크루아상 6,500원
▶ 음료 — 드립 5,500 / 아이스라떼 5,800

#분당카페 #정자동카페 #메종드빵`,
  },
  {
    id: "p_004",
    campaignId: "c_yeoksam_pt",
    title: "역삼동 헬스장 PT 가격 비교 (3곳 직접 등록 후기)",
    platform: "NAVER_CAFE",
    kind: "original",
    keywords: ["역삼 헬스장", "역삼 PT", "강남 헬스장"],
    region: "서울 · 역삼",
    industry: "헬스/PT",
    cta: "무료 체험 1회 신청",
    createdAt: "2026-05-11T07:30:00",
    status: "published",
    copyCount: 2,
    memo: "강남 카페 / 직장인맘 카페 동시 발행함",
    scheduledAt: null,
    recyclable: true,
    body: `직장인 맘 카페에 PT 가격 정보 공유드려요. A 65,000 / B 58,000 / C 72,000.
저는 B에 등록.`,
  },
  {
    id: "p_005",
    campaignId: "c_cheongju_ob",
    title: "잠실 산부인과 추천! 임신초기 검진 후기 + 비용 정리",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["잠실 산부인과", "임신초기검진", "송파 산부인과"],
    region: "서울 · 잠실",
    industry: "의료",
    cta: "초진 예약 02-XXX-XXXX",
    createdAt: "2026-05-10T22:11:00",
    status: "scheduled",
    copyCount: 0,
    memo: "이미지 3장 첨부 예정",
    scheduledAt: "2026-05-12T10:00:00",
    recyclable: false,
    body: `잠실 산부인과 초진 후기.
초음파+혈액검사+상담 8만원대, 국민행복카드 가능.`,
  },
  {
    id: "p_006",
    campaignId: "c_cheongju_ob",
    title: "청주 오송 산부인과 검진 후기 + 비용 정리",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["청주 산부인과", "오송 산부인과", "청주 임산부"],
    region: "충북 · 청주",
    industry: "의료",
    cta: "초진 예약 가능",
    createdAt: "2026-05-08T10:40:00",
    status: "draft",
    copyCount: 0,
    scheduledAt: null,
    recyclable: false,
    body: `오송쪽 산부인과 다녀온 첫 검진 후기. 초음파 약 3만원대.`,
  },
  {
    id: "p_007",
    campaignId: "c_suwon_food",
    title: "수원 인계동 맛집 BEST 5 — 현지인이 진짜 가는 곳",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["수원 맛집", "인계동 맛집", "수원 데이트"],
    region: "경기 · 수원",
    industry: "F&B",
    cta: "예약은 네이버 톡톡",
    createdAt: "2026-05-10T20:05:00",
    status: "ready",
    copyCount: 0,
    memo: "지도 캡처 5장 본문 삽입 자리",
    scheduledAt: null,
    recyclable: false,
    body: `수원 토박이가 정리한 인계동 진짜 맛집 5곳.`,
  },
  {
    id: "p_008",
    campaignId: "c_suwon_food",
    title: "수원 인계 맛집 — 데이트용 BEST 3 (맘카페 추천판)",
    platform: "NAVER_CAFE",
    kind: "variant",
    keywords: ["수원 맛집", "수원 데이트", "인계동"],
    region: "경기 · 수원",
    industry: "F&B",
    cta: "예약 네이버 톡톡",
    createdAt: "2026-05-10T20:10:00",
    status: "draft",
    copyCount: 0,
    memo: "맘카페 톤으로 변형",
    scheduledAt: null,
    recyclable: false,
    body: `수원 데이트 코스로 좋은 인계동 맛집 3곳만 골라봤어요 :)`,
  },
  {
    id: "p_009",
    campaignId: "c_jamsil_kids",
    title: "송파 잠실 키즈카페 후기 (만 3세, 6세 함께 가기 좋은 곳)",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["잠실 키즈카페", "송파 키즈카페", "유아 놀이공간"],
    region: "서울 · 송파",
    industry: "육아",
    cta: "주말 예약 필수",
    createdAt: "2026-05-10T14:20:00",
    status: "published",
    copyCount: 4,
    memo: "재발행 — 주말 후기 추가",
    scheduledAt: null,
    recyclable: true,
    body: `두 아이 데리고 다녀온 잠실 키즈카페 후기. 입장료 평일 28,000 / 주말 35,000.`,
  },
  {
    id: "p_010",
    campaignId: "c_jamsil_kids",
    title: "잠실 키즈카페 추천 — 직장인맘 주말 활용 팁",
    platform: "NAVER_CAFE",
    kind: "variant",
    keywords: ["잠실 키즈카페", "주말 키즈카페", "직장맘"],
    region: "서울 · 송파",
    industry: "육아",
    cta: "주말 예약 필수",
    createdAt: "2026-05-10T14:30:00",
    status: "ready",
    copyCount: 0,
    scheduledAt: null,
    recyclable: false,
    body: `주말에 잠실 키즈카페 다녀온 후기 + 예약 꿀팁 정리.`,
  },
  {
    id: "p_011",
    campaignId: "c_jamsil_kids",
    title: "잠실 키즈카페 평일 가성비 후기 (재활용 가능)",
    platform: "NAVER_BLOG",
    kind: "recycled",
    keywords: ["잠실 키즈카페", "평일 키즈카페", "가성비"],
    region: "서울 · 송파",
    industry: "육아",
    cta: "평일 30% 할인",
    createdAt: "2026-04-22T10:00:00",
    status: "published",
    copyCount: 7,
    memo: "성과 좋음 — 다른 지역으로 변형 검토",
    scheduledAt: null,
    recyclable: true,
    body: `평일 오후 잠실 키즈카페 후기. 한가하고 가성비 좋아요.`,
  },
  {
    id: "p_012",
    campaignId: "c_magok_dental",
    title: "강서구 마곡 치과 추천, 임플란트 가격 알아본 후기",
    platform: "NAVER_BLOG",
    kind: "original",
    keywords: ["마곡 치과", "강서구 임플란트", "마곡 임플란트"],
    region: "서울 · 마곡",
    industry: "의료",
    cta: "상담 02-XXXX-XXXX",
    createdAt: "2026-05-10T11:55:00",
    status: "ready",
    copyCount: 1,
    scheduledAt: null,
    recyclable: false,
    body: `마곡 치과 임플란트 견적 3군데 비교 후기. A 110 / B 95 / C 120.`,
  },
];

// ── Templates ───────────────────────────────────────────────────────────
export const TEMPLATES: PostTemplate[] = [
  { id: "t1", platform: "NAVER_BLOG", name: "지역 + 업종 후기 (기본)", uses: 142, updatedAt: "2026-05-09" },
  { id: "t2", platform: "NAVER_BLOG", name: "가격 비교 정리형", uses: 87, updatedAt: "2026-05-09" },
  { id: "t3", platform: "NAVER_BLOG", name: "데이트 / 가족 방문 후기", uses: 64, updatedAt: "2026-05-07" },
  { id: "t4", platform: "NAVER_CAFE", name: "카페 정보 공유형 (질문 답변)", uses: 121, updatedAt: "2026-05-09" },
  { id: "t5", platform: "NAVER_CAFE", name: "맘카페 가성비 추천형", uses: 56, updatedAt: "2026-05-05" },
  { id: "t6", platform: "NAVER_BLOG", name: "임플란트 · 의료 후기", uses: 33, updatedAt: "2026-05-02" },
];

// ── Prompts (사용자 작성 라이브러리) ─────────────────────────────────────
const COMMON_OUT = `#CAMPAIGN: {campaign}
#PLATFORM: BLOG|CAFE
#KIND: 원본|변형|재활용
#KEYWORDS: kw1, kw2, kw3
#REGION: ...
#INDUSTRY: ...
#CTA: ...

제목: ...

본문:
...`;

export const PROMPTS: Prompt[] = [
  {
    id: "pr1",
    name: "키즈카페 후기형",
    category: "육아",
    platform: "NAVER_BLOG",
    uses: 34,
    updatedAt: "2026-05-09",
    description: "키즈카페 방문 후기. 친근 톤·3~6단락·해시태그 5개 미만.",
    variables: ["campaign", "cta", "child_age"],
    outputFormat: COMMON_OUT,
    webhookEnabled: true,
    autoParse: true,
    schedule: "매일 08:30",
    lastRunAt: "2026-05-11T08:30:00",
    lastRunStatus: "ok",
    lastRunCount: 6,
    successRate: 0.96,
    body: `너는 한국 네이버 블로그 후기 작성자다.
다음 정보를 받아 키즈카페 방문 후기 한 편을 작성한다.

출력 형식:
${COMMON_OUT}

톤: 친근, 솔직, 3-6단락, 해시태그 5개 미만.`,
  },
  {
    id: "pr2",
    name: "지역맘카페 홍보형",
    category: "맘카페",
    platform: "NAVER_CAFE",
    uses: 28,
    updatedAt: "2026-05-09",
    description: "맘카페 회원 톤. 과장 광고 금지·후기 위주·짧은 단락.",
    variables: ["campaign", "cta", "keywords"],
    outputFormat: COMMON_OUT,
    webhookEnabled: true,
    autoParse: true,
    schedule: "매일 09:00",
    lastRunAt: "2026-05-11T09:01:00",
    lastRunStatus: "ok",
    lastRunCount: 3,
    successRate: 1.0,
    body: `너는 지역 맘카페 회원처럼 정보를 공유한다.\n과장된 광고 톤 금지, 후기 위주.\n\n${COMMON_OUT}`,
  },
  {
    id: "pr3",
    name: "블로그 SEO형 (지역+업종)",
    category: "SEO",
    platform: "NAVER_BLOG",
    uses: 51,
    updatedAt: "2026-05-10",
    description: "키워드 4~6회 배치·첫 문단에 지역+업종 키워드 명시·H2 3개.",
    variables: ["region", "industry", "keywords"],
    outputFormat: COMMON_OUT,
    webhookEnabled: true,
    autoParse: true,
    schedule: "매일 07:00",
    lastRunAt: "2026-05-11T07:02:00",
    lastRunStatus: "ok",
    lastRunCount: 8,
    successRate: 0.92,
    body: `SEO 블로그 글 작성. 키워드 자연스럽게 4-6회 배치, 첫 문단에 지역+업종 키워드 명시.\n\n${COMMON_OUT}`,
  },
];

// ── Intake feed (최근 도착한 Claude 결과) ────────────────────────────────
export const INTAKE_FEED: IntakeEvent[] = [
  { id: "in_021", at: "2026-05-11T09:12:14", source: "hook", promptId: "pr2", promptName: "지역맘카페 홍보형",
    title: "잠실 키즈카페 평일 가성비 후기 (직장맘 추천)", campaignMatched: "잠실 키즈카페", campaignId: "c_jamsil_kids",
    platform: "NAVER_CAFE", parseStatus: "ok", queued: true, latencyMs: 340 },
  { id: "in_020", at: "2026-05-11T09:11:48", source: "hook", promptId: "pr1", promptName: "키즈카페 후기형",
    title: "잠실에서 진짜 만족했던 키즈카페 후기 (주말 가족 외출)", campaignMatched: "잠실 키즈카페", campaignId: "c_jamsil_kids",
    platform: "NAVER_BLOG", parseStatus: "ok", queued: true, latencyMs: 298 },
  { id: "in_018", at: "2026-05-11T08:30:09", source: "hook", promptId: "pr3", promptName: "블로그 SEO형 (지역+업종)",
    title: "강남 1인 미용실 솔직 후기 — 컷펌 가격 비교", campaignMatched: "강남역 1인 미용실", campaignId: "c_gangnam_hair",
    platform: "NAVER_BLOG", parseStatus: "ok", queued: true, latencyMs: 267 },
  { id: "in_017", at: "2026-05-11T08:30:05", source: "hook", promptId: "pr3", promptName: "블로그 SEO형 (지역+업종)",
    title: "분당 정자동 신상 베이커리 추천 BEST 3", campaignMatched: "분당 베이커리", campaignId: "c_bundang_bake",
    platform: "NAVER_BLOG", parseStatus: "warn", queued: true, latencyMs: 301, warnings: ["#CTA 누락"] },
  { id: "in_014", at: "2026-05-11T07:00:31", source: "hook", promptId: "pr3", promptName: "블로그 SEO형 (지역+업종)",
    title: "(파싱 실패) 청주 산부인과 — 본문 누락", campaignMatched: "청주 산부인과", campaignId: "c_cheongju_ob",
    platform: "NAVER_BLOG", parseStatus: "error", queued: false, latencyMs: 412, warnings: ["본문 누락", "#KIND 누락"] },
  { id: "in_013", at: "2026-05-10T22:14:08", source: "manual", promptId: null, promptName: "수동 paste",
    title: "해운대 펜션 5곳 오션뷰 비교", campaignMatched: "해운대 펜션", campaignId: "c_haeundae_stay",
    platform: "NAVER_BLOG", parseStatus: "ok", queued: true, latencyMs: 0 },
];

// ── Import batches ──────────────────────────────────────────────────────
export const IMPORT_BATCHES: ImportBatch[] = [
  { id: "i1", at: "2026-05-11T09:12:14", source: "hook", sourceName: "Claude · Webhook (실시간)",         count: 7, parsed: 6, status: "applied", summary: "8 prompts active · 1 warn" },
  { id: "i2", at: "2026-05-11T08:30:09", source: "hook", sourceName: "Claude Scheduled · 08:30 일배치",   count: 4, parsed: 3, status: "partial", summary: "1 error · 본문 누락" },
  { id: "i3", at: "2026-05-10T22:14:08", source: "manual", sourceName: "Manual paste · 정수민",            count: 3, parsed: 3, status: "applied", summary: "오프라인 백업" },
  { id: "i4", at: "2026-05-10T09:00:14", source: "hook", sourceName: "Claude Scheduled · 09:00 일배치",   count: 5, parsed: 5, status: "applied", summary: "" },
];

// ── Automation rollup (sidebar) ──────────────────────────────────────────
export const AUTOMATION = {
  hookLive: true,
  hookCount: 2,
  autoParseOn: 5,
  manualOnly: 1,
  intake24h: 18,
  queuedToday: 14,
  errorsToday: 1,
  lastHookAt: "2026-05-11T09:12:14",
};

// ── Status / Platform / Kind metadata (design 호환) ──────────────────────
export const STATUSES = [
  { key: "draft",     label: "초안",     dot: "#6b6b6b" },
  { key: "ready",     label: "발행대기", dot: "#f5a524" },
  { key: "scheduled", label: "예약",     dot: "#5e80f5" },
  { key: "published", label: "발행완료", dot: "#3acc81" },
  { key: "archived",  label: "보관",     dot: "#4a4a4a" },
] as const;

export const PLATFORMS = [
  { key: "NAVER_BLOG", label: "Naver Blog", short: "BLOG" },
  { key: "NAVER_CAFE", label: "Naver Cafe", short: "CAFE" },
] as const;

export const KINDS = [
  { key: "original", label: "원본",   tone: "#9ea0a8" },
  { key: "variant",  label: "변형",   tone: "#a385ff" },
  { key: "recycled", label: "재활용", tone: "#3acc81" },
] as const;

// ── Hooks (webhook endpoints) ────────────────────────────────────────────
export const HOOKS: HookEndpoint[] = [
  {
    id: "hk_default", name: "Claude Scheduled · 기본 엔드포인트",
    url: "https://hub.posting/intake/c8f4e2a1", protocol: "POST · JSON",
    status: "live", uptime: 0.998, lastPingAt: "2026-05-11T09:12:14",
    secret: "phk_•••••••••••••e2a1", authType: "Bearer",
    receivedToday: 14, errorsToday: 1, p50LatencyMs: 312,
    boundPrompts: ["pr1", "pr2", "pr3"],
  },
  {
    id: "hk_review", name: "의료 후기 · 수동 승인 엔드포인트",
    url: "https://hub.posting/intake/medical-9d2f", protocol: "POST · JSON",
    status: "review", uptime: 1.0, lastPingAt: "2026-05-10T22:00:11",
    secret: "phk_•••••••••••••9d2f", authType: "Bearer",
    receivedToday: 0, errorsToday: 0, p50LatencyMs: 401,
    boundPrompts: [],
  },
];
