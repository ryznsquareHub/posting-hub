import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import { relinkIntakeCampaign, getIntakeRaw } from "@/lib/api/intake";
import { createPost } from "@/lib/api/posts";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveOwnerId } from "@/lib/auth/ownerId";
import type { Campaign } from "@/types/campaign";

import { parseClaudeOutput } from "./parseClaudeOutput";

interface RelinkArgs {
  eventId: string;
  /** null = 매칭 해제 */
  campaign: Campaign | null;
  /** parseClaudeOutput 에 넘길 캠페인 목록 (재매칭 직후의 정합성 보장) */
  campaigns: Campaign[];
}

interface RelinkResult {
  promoted: boolean;
  alreadyExists?: boolean;
  reason?: string;
}

/**
 * Intake row 의 캠페인을 inline 재지정.
 * - campaign === null  →  매칭 해제만 (posts 변경 없음)
 * - campaign 지정 + parse_status === 'ok' + raw_body 존재
 *     →  raw_body 재파싱 후 posts insert (status: 'draft')
 * - 같은 (campaign, title) posts 가 이미 있으면 중복 승급 건너뜀
 */
export function useRelinkIntake() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: RelinkArgs): Promise<RelinkResult> => {
      const ownerId = resolveOwnerId(user?.id);
      if (!ownerId) throw new Error("owner_id 결정 불가");

      await relinkIntakeCampaign(
        args.eventId,
        args.campaign?.id ?? null,
        args.campaign?.name ?? null,
      );

      if (!args.campaign) return { promoted: false, reason: "unlink" };

      const { rawBody, parseStatus, title } = await getIntakeRaw(args.eventId);
      if (parseStatus === "error") {
        return { promoted: false, reason: "parse_error" };
      }
      if (!rawBody) {
        return { promoted: false, reason: "raw_body_missing" };
      }

      const { data: dups } = await supabase()
        .from("posts")
        .select("id")
        .eq("campaign_id", args.campaign.id)
        .eq("title", title)
        .limit(1);
      if (dups && dups.length > 0) {
        return { promoted: false, alreadyExists: true };
      }

      const blocks = parseClaudeOutput(rawBody, args.campaigns);
      const b = blocks[0];
      if (!b || !b.ok) {
        return { promoted: false, reason: "reparse_failed" };
      }

      await createPost(
        {
          id: "p_rl_" + Math.random().toString(36).slice(2, 10),
          campaignId: args.campaign.id,
          title: b.title,
          body: b.body,
          platform: b.platform,
          kind: b.kind,
          keywords: b.keywords,
          region: b.region || undefined,
          industry: b.industry || undefined,
          cta: b.cta || undefined,
          status: "draft",
          copyCount: 0,
          recyclable: false,
        },
        ownerId,
      );
      return { promoted: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intake"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
