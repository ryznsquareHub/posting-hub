/**
 * Claude 출력 (structured) 파서.
 * 기대 형식:
 *
 *   #CAMPAIGN: 잠실 키즈카페
 *   #PLATFORM: BLOG   (또는 CAFE)
 *   #KIND: 원본       (또는 변형 / 재활용)
 *   #KEYWORDS: kw1, kw2
 *   #REGION: 서울
 *   #INDUSTRY: 육아
 *   #CTA: 주말 예약 필수
 *
 *   제목: ...
 *
 *   본문:
 *   ...
 *
 * 여러 글이 `---` 로 구분되어 들어올 수 있음.
 */

export type Platform = "NAVER_BLOG" | "NAVER_CAFE";
export type Kind = "original" | "variant" | "recycled";
export type ParseStatus = "ok" | "warn" | "error";

export interface ParsedPost {
  campaign: string;
  platform: Platform;
  kind: Kind;
  keywords: string[];
  region: string;
  industry: string;
  cta: string;
  title: string;
  body: string;
  parseStatus: ParseStatus;
  warnings: string[];
}

const FIELD_RE = /^#([A-Z_]+):\s*(.*)$/;

function platformFromTag(v: string): Platform {
  const u = v.trim().toUpperCase();
  if (u === "BLOG" || u === "NAVER_BLOG") return "NAVER_BLOG";
  if (u === "CAFE" || u === "NAVER_CAFE") return "NAVER_CAFE";
  return "NAVER_BLOG";
}

function kindFromTag(v: string): Kind {
  const t = v.trim();
  if (t.includes("변형")) return "variant";
  if (t.includes("재활용")) return "recycled";
  return "original";
}

export function parseSingle(raw: string): ParsedPost {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const warnings: string[] = [];

  const fields: Record<string, string> = {};
  let bodyStart = -1;
  let title = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = FIELD_RE.exec(line);
    if (m) {
      fields[m[1].toUpperCase()] = m[2].trim();
      continue;
    }
    // 제목: ...
    const tm = /^제목\s*:\s*(.*)$/.exec(line);
    if (tm) {
      title = tm[1].trim();
      continue;
    }
    // 본문: 다음 라인부터
    if (/^본문\s*:\s*$/.test(line.trim())) {
      bodyStart = i + 1;
      break;
    }
  }

  let body = "";
  if (bodyStart >= 0) {
    body = lines.slice(bodyStart).join("\n").trim();
  } else {
    // 본문 마커 없으면 fields 종료 후 모든 비-필드 라인을 body 로
    body = lines
      .filter((l) => !FIELD_RE.test(l) && !/^제목\s*:/.test(l))
      .join("\n")
      .trim();
    if (body) warnings.push("본문: 마커 누락");
  }

  if (!title) warnings.push("제목 누락");
  if (!body) warnings.push("본문 누락");
  if (!fields.CAMPAIGN) warnings.push("#CAMPAIGN 누락");
  if (!fields.PLATFORM) warnings.push("#PLATFORM 누락");
  if (!fields.KIND) warnings.push("#KIND 누락");
  if (!fields.CTA) warnings.push("#CTA 누락");

  let parseStatus: ParseStatus = "ok";
  if (!title || !body) parseStatus = "error";
  else if (warnings.length > 0) parseStatus = "warn";

  return {
    campaign: fields.CAMPAIGN ?? "",
    platform: platformFromTag(fields.PLATFORM ?? ""),
    kind: kindFromTag(fields.KIND ?? ""),
    keywords: (fields.KEYWORDS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    region: fields.REGION ?? "",
    industry: fields.INDUSTRY ?? "",
    cta: fields.CTA ?? "",
    title,
    body,
    parseStatus,
    warnings,
  };
}

export function parseBatch(raw: string): ParsedPost[] {
  // `---` 또는 `===` 로 구분된 다중 글
  const chunks = raw
    .split(/^\s*(?:-{3,}|={3,})\s*$/m)
    .map((c) => c.trim())
    .filter(Boolean);
  return chunks.map(parseSingle);
}
