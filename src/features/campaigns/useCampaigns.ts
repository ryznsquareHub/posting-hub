import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listCampaigns, getCampaign } from "@/lib/api/campaigns";
import { CAMPAIGNS, campaignById } from "@/data/seed";
import type { Campaign } from "@/types/campaign";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async (): Promise<Campaign[]> => {
      if (!isSupabaseConfigured) return CAMPAIGNS;
      return listCampaigns();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery({
    queryKey: ["campaign", id ?? null],
    queryFn: async (): Promise<Campaign | null> => {
      if (!id) return null;
      if (!isSupabaseConfigured) return campaignById(id) ?? null;
      return getCampaign(id);
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
