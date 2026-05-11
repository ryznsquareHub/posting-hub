import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listPrompts } from "@/lib/api/prompts";
import { PROMPTS } from "@/data/seed";
import type { Prompt } from "@/types/prompt";

export function usePrompts() {
  return useQuery({
    queryKey: ["prompts"],
    queryFn: async (): Promise<Prompt[]> => {
      if (!isSupabaseConfigured) return PROMPTS;
      return listPrompts();
    },
    staleTime: 60_000,
  });
}
