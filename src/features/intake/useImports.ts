import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listImports } from "@/lib/api/imports";
import { IMPORT_BATCHES } from "@/data/seed";
import type { ImportBatch } from "@/types/intake";

export function useImports(limit = 50) {
  return useQuery({
    queryKey: ["imports", limit],
    queryFn: async (): Promise<ImportBatch[]> => {
      if (!isSupabaseConfigured) return IMPORT_BATCHES;
      return listImports(limit);
    },
    staleTime: 60_000,
  });
}
