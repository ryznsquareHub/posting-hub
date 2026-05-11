import type { Post } from "@/types/post";

/**
 * 디자인 quickops.jsx 의 matchesScoped 1:1.
 *
 * Tokens:
 *   platform:blog | cafe
 *   status:ready | published | scheduled | draft | archived
 *   region:서울
 *   industry:카페 (또는 ind:)
 *   kw:키워드 (또는 keyword:)
 *   memo:문구
 *
 * 토큰 외 일반어는 title + body + keywords 에 AND 매칭.
 */
export function matchesScoped(post: Post, query: string): boolean {
  const tokens = (query || "").trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  for (const raw of tokens) {
    const m = raw.match(/^([a-z]+):(.+)$/i);
    if (m) {
      const k = m[1].toLowerCase();
      const v = m[2].toLowerCase();
      if (k === "platform") {
        const tag = post.platform === "NAVER_CAFE" ? "cafe" : "blog";
        if (!tag.includes(v)) return false;
      } else if (k === "status") {
        if (!post.status.toLowerCase().includes(v)) return false;
      } else if (k === "region") {
        if (!(post.region ?? "").toLowerCase().includes(v)) return false;
      } else if (k === "industry" || k === "ind") {
        if (!(post.industry ?? "").toLowerCase().includes(v)) return false;
      } else if (k === "kw" || k === "keyword") {
        if (!post.keywords.some((kw) => kw.toLowerCase().includes(v)))
          return false;
      } else if (k === "memo") {
        if (!(post.memo ?? "").toLowerCase().includes(v)) return false;
      } else {
        // 알 수 없는 토큰 → 전체 검색
        const hay = JSON.stringify(post).toLowerCase();
        if (!hay.includes(v)) return false;
      }
    } else {
      const hay =
        (post.title + " " + post.body + " " + post.keywords.join(" ")).toLowerCase();
      if (!hay.includes(raw.toLowerCase())) return false;
    }
  }
  return true;
}
