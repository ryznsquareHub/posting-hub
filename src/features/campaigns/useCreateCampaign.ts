import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createCampaign, type CampaignInput } from "@/lib/api/campaigns";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveOwnerId } from "@/lib/auth/ownerId";
import type { Campaign } from "@/types/campaign";

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: CampaignInput): Promise<Campaign> => {
      if (!isSupabaseConfigured) {
        // mock 모드: 그냥 객체 return — UI 갱신 X
        return {
          id: input.id,
          name: input.name,
          region: input.region ?? "",
          industry: input.industry ?? "",
          color: input.color ?? "#6e7af0",
          clientNote: input.clientNote ?? "",
          startedAt: input.startedAt ?? new Date().toISOString().slice(0, 10),
          settings: {
            brand: input.brand ?? input.name,
            platforms: input.platforms ?? [],
            cta: input.cta ?? "",
            tone: input.tone ?? "",
            audience: input.audience ?? "",
            keywords: input.keywords ?? [],
          },
          activeVariantId: input.activeVariantId,
          variants: [],
        };
      }
      const ownerId = resolveOwnerId(user?.id);
      if (!ownerId) throw new Error("owner_id 결정 불가 (env VITE_PUBLIC_OWNER_ID 필요)");
      return createCampaign(input, ownerId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
