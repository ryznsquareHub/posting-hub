import { useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";
import { relinkIntakeCampaign, getIntakeRaw } from "@/lib/api/intake";
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
      const sb = supabase();

      await relinkIntakeCampaign(
        args.eventId,
        args.campaign?.id ?? null,
        args.campaign?.name ?? null,
      );

      // 이미 이 intake_event 로 promote 된 posts 가 있으면, 새 insert 대신
      // 기존 row 의 campaign_id 만 update. unlink 라도 기존 posts 는 유지 (status='draft' 인 채).
      // (source_intake_id 컬럼은 0005 마이그레이션에서 추가됨 — types.ts 재생성 전이라 cast 사용)
      const { data: existing } = await sb
        .from("posts")
        .select("id, campaign_id")
        .eq("source_intake_id" as never, args.eventId)
        .limit(1);
      const existingId = (existing?.[0] as { id?: string } | undefined)?.id ?? null;

      if (!args.campaign) {
        return { promoted: false, reason: "unlink" };
      }

      if (existingId) {
        await sb
          .from("posts")
          .update({ campaign_id: args.campaign.id, updated_at: new Date().toISOString() })
          .eq("id", existingId);
        return { promoted: false, alreadyExists: true };
      }

      const { rawBody, parseStatus, title } = await getIntakeRaw(args.eventId);
      if (parseStatus === "error") {
        return { promoted: false, reason: "parse_error" };
      }
      if (!rawBody) {
        return { promoted: false, reason: "raw_body_missing" };
      }

      // 옛 데이터: raw_body 가 batch 전체 (여러 글 + ---) 인 경우.
      // 새 Hook 은 chunk 별로 저장 — blocks.length === 1.
      // 안전하게 title 일치 chunk 를 우선 선택.
      const blocks = parseClaudeOutput(rawBody, args.campaigns);
      const b = blocks.find((x) => x.title === title) ?? blocks[0];
      if (!b || !b.ok) {
        return { promoted: false, reason: "reparse_failed" };
      }

      // posts.title + same campaign 의 다른 origin posts 가 이미 있어도 한 번은 만든다 —
      // source_intake_id 가 고유 보장이라 동일 intake 가 두 번 insert 되는 일은 없음.
      const postId = "p_rl_" + Math.random().toString(36).slice(2, 10);
      const insertRow = {
        id: postId,
        owner_id: ownerId,
        campaign_id: args.campaign.id,
        title: b.title,
        body: b.body,
        platform: b.platform,
        kind: b.kind,
        keywords: b.keywords,
        region: b.region || null,
        industry: b.industry || null,
        cta: b.cta || null,
        status: "draft",
        copy_count: 0,
        recyclable: false,
        source_intake_id: args.eventId,
      };
      const { error } = await sb.from("posts").insert(insertRow as never);
      if (error) throw error;
      return { promoted: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intake"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
