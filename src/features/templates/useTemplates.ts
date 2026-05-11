import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listTemplates } from "@/lib/api/templates";
import { TEMPLATES } from "@/data/seed";
import type { PostTemplate } from "@/types/prompt";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async (): Promise<PostTemplate[]> => {
      if (!isSupabaseConfigured) return TEMPLATES;
      return listTemplates();
    },
    staleTime: 60_000,
  });
}
