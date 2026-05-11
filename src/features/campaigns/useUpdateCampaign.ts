import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Campaign } from "@/types/campaign";

export interface CampaignUpdate {
  id: string;
  brand?: string;
  region?: string;
  industry?: string;
  cta?: string;
  tone?: string;
  audience?: string;
  keywords?: string[];
  active_variant_id?: string | null;
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (u: CampaignUpdate): Promise<Partial<Campaign>> => {
      if (!isSupabaseConfigured) return { id: u.id };
      const { id, ...patch } = u;
      const { data, error } = await supabase()
        .from("campaigns")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return { id: data.id, name: data.name };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      qc.invalidateQueries({ queryKey: ["campaign"] });
    },
  });
}
