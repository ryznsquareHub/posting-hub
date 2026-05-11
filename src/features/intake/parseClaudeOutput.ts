import type { Campaign } from "@/types/campaign";
import type { Platform, PostKind } from "@/types/post";

export interface ParsedBlock {
  _idx: number;
  ok: boolean;
  campaignName: string;
  campaignId: string | null;
  platform: Platform;
  kind: PostKind;
  title: string;
  body: string;
  cta: string;
  keywords: string[];
  region: string;
  industry: string;
  warnings: string[];
}

/**
 * 디자인 pages.jsx 의 parseClaudeOutput 1:1.
 * Claude structured output 을 ParsedBlock[] 으로.
 */
export function parseClaudeOutput(raw: string, campaigns: Campaign[]): ParsedBlock[] {
  const blocks = raw
    .split(/\n-{3,}\n|\n={3,}\n/g)
    .map((b) => b.trim())
    .filter(Boolean);
  let pieces: string[] = blocks;
  if (pieces.length === 1) {
    const splits = raw
      .split(/(?=^#CAMPAIGN:)/gm)
      .map((b) => b.trim())
      .filter(Boolean);
    if (splits.length > 1) pieces = splits;
  }
  return pieces.map((block, idx) => {
    const meta: Record<string, string> = {};
    const lines = block.split("\n");
    let title = "";
    const bodyLines: string[] = [];
    let inBody = false;
    lines.forEach((ln, i) => {
      const m = ln.match(/^#([A-Z_]+):\s*(.+)$/);
      if (m && !inBody) {
        meta[m[1]] = m[2].trim();
        return;
      }
      const t = ln.match(/^제목\s*:\s*(.+)$/);
      if (t && !inBody) {
        title = t[1].trim();
        return;
      }
      if (/^본문\s*:\s*$/.test(ln)) {
        inBody = true;
        return;
      }
      if (inBody || (title && i > 0)) bodyLines.push(ln);
    });
    const body = bodyLines.join("\n").trim();
    let campaignId: string | null = null;
    if (meta.CAMPAIGN) {
      const c = campaigns.find(
        (c) => c.name === meta.CAMPAIGN || c.name.includes(meta.CAMPAIGN),
      );
      campaignId = c?.id ?? null;
    }
    const keywords = meta.KEYWORDS
      ? meta.KEYWORDS.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
      : [];
    const warnings: string[] = [];
    if (!title) warnings.push("제목 누락");
    if (!body) warnings.push("본문 누락");
    if (!meta.CAMPAIGN) warnings.push("#CAMPAIGN 누락");
    if (!meta.PLATFORM) warnings.push("#PLATFORM 누락");
    const platformUpper = (meta.PLATFORM ?? "BLOG").toUpperCase();
    const platform: Platform = platformUpper.includes("CAFE")
      ? "NAVER_CAFE"
      : "NAVER_BLOG";
    const kindRaw = (meta.KIND ?? "원본").toLowerCase();
    const kind: PostKind = kindRaw.includes("변형")
      ? "variant"
      : kindRaw.includes("재활용")
        ? "recycled"
        : "original";
    return {
      _idx: idx,
      ok: Boolean(title && body),
      campaignName: meta.CAMPAIGN ?? "",
      campaignId,
      platform,
      kind,
      title: title || "(제목 없음)",
      body,
      cta: meta.CTA ?? "",
      keywords,
      region: meta.REGION ?? "",
      industry: meta.INDUSTRY ?? "",
      warnings,
    };
  });
}

export const SAMPLE_IMPORT = `#CAMPAIGN: 잠실 키즈카페
#PLATFORM: BLOG
#KIND: 원본
#KEYWORDS: 잠실키즈카페, 주말데이트, 아이와함께
#REGION: 잠실
#INDUSTRY: 키즈카페
#CTA: 주말 예약 필수 — 카카오톡 채널 문의

제목: 잠실에서 진짜 만족했던 키즈카페 후기 (주말 가족 외출)

본문:
요즘 아이와 갈 만한 곳을 정말 많이 찾아다녔어요. 그러다 잠실 쪽에 새로 생긴 키즈카페를 다녀왔는데, 솔직히 기대를 안 했다가 너무 만족해서 후기 남깁니다.

일단 공간이 정말 넓고, 연령대별로 존이 나뉘어 있어서 동선이 안 꼬여요.

---

#CAMPAIGN: 강남역 1인 미용실
#PLATFORM: CAFE
#KIND: 변형
#KEYWORDS: 강남미용실, 컷펌, 디자이너팁
#REGION: 강남
#INDUSTRY: 미용실
#CTA: 첫 방문 시 트리트먼트 무료

제목: 강남에서 펌 잘하는 곳 있나요? (직접 다녀온 후기)

본문:
지인 추천으로 갔다가 너무 만족해서 카페에도 공유해요.`;
