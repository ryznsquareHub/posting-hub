import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ingestManualPaste } from "@/lib/api/intake";
import { createPost } from "@/lib/api/posts";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveOwnerId } from "@/lib/auth/ownerId";
import type { ParsedBlock } from "./parseClaudeOutput";

/**
 * Manual Paste → intake_events insert + (parse_status=ok 면) posts auto-create.
 * 디자인의 "fallback" 흐름. Hook 자동 흐름이 못 닿는 케이스 백업.
 */
export function useManualPaste() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (parsed: ParsedBlock[]) => {
      if (!isSupabaseConfigured) {
        return { ingested: 0, posts: 0 } as const;
      }
      const ownerId = resolveOwnerId(user?.id);
      if (!ownerId) throw new Error("owner_id 결정 불가");
      const ok = parsed.filter((p) => p.ok);
      let ingested = 0;
      let posts = 0;
      for (const p of ok) {
        await ingestManualPaste({
          ownerId,
          raw: serializeBlock(p),
          title: p.title,
          campaignId: p.campaignId ?? undefined,
          campaignMatched: p.campaignName || undefined,
          platform: p.platform,
          parseStatus: p.warnings.length > 0 ? "warn" : "ok",
          warnings: p.warnings,
        });
        ingested++;
        if (p.campaignId) {
          await createPost(
            {
              id: "p_man_" + Math.random().toString(36).slice(2, 10),
              campaignId: p.campaignId,
              title: p.title,
              body: p.body,
              platform: p.platform,
              kind: p.kind,
              keywords: p.keywords,
              region: p.region || undefined,
              industry: p.industry || undefined,
              cta: p.cta || undefined,
              status: "ready",
              copyCount: 0,
              recyclable: false,
            },
            ownerId,
          );
          posts++;
        }
      }
      return { ingested, posts };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intake"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["imports"] });
    },
  });
}

function serializeBlock(p: ParsedBlock): string {
  return [
    `#CAMPAIGN: ${p.campaignName}`,
    `#PLATFORM: ${p.platform === "NAVER_CAFE" ? "CAFE" : "BLOG"}`,
    `#KIND: ${p.kind === "variant" ? "변형" : p.kind === "recycled" ? "재활용" : "원본"}`,
    `#KEYWORDS: ${p.keywords.join(", ")}`,
    `#REGION: ${p.region}`,
    `#INDUSTRY: ${p.industry}`,
    `#CTA: ${p.cta}`,
    ``,
    `제목: ${p.title}`,
    ``,
    `본문:`,
    p.body,
  ].join("\n");
}
