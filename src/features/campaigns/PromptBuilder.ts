/**
 * 캠페인 설정 + Variant + batchSize → Claude prompt 최종 문자열.
 * 디자인 패키지 data.js 의 buildPrompt (window 전역) 와 동일 토큰.
 */

import type { Campaign, VariantPreset } from "@/types/campaign";

export function buildPrompt(
  campaign: Campaign,
  variant: VariantPreset | undefined,
  batchSize = 3,
): string {
  if (!variant) return "(Variant 가 없습니다)";
  const s = campaign.settings;
  const replacements: Record<string, string> = {
    "{brand}":     s?.brand ?? campaign.name,
    "{region}":    campaign.region,
    "{industry}":  campaign.industry,
    "{keywords}":  (s?.keywords ?? []).join(", "),
    "{cta}":       s?.cta ?? "",
    "{tone}":      s?.tone ?? "",
    "{audience}":  s?.audience ?? "",
    "{batchSize}": String(batchSize),
  };
  let out = variant.template;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  return out;
}
