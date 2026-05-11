import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { listIntakeEvents } from "@/lib/api/intake";
import { listHooks } from "@/lib/api/hooks";
import { INTAKE_FEED, HOOKS } from "@/data/seed";
import type { IntakeEvent, HookEndpoint } from "@/types/intake";

export function useIntakeFeed(limit = 50) {
  return useQuery({
    queryKey: ["intake", "feed", limit],
    queryFn: async (): Promise<IntakeEvent[]> => {
      if (!isSupabaseConfigured) return INTAKE_FEED.slice(0, limit);
      return listIntakeEvents(limit);
    },
    staleTime: 15_000,
    refetchInterval: isSupabaseConfigured ? 20_000 : false,
  });
}

export function useHookEndpoints() {
  return useQuery({
    queryKey: ["hooks"],
    queryFn: async (): Promise<HookEndpoint[]> => {
      if (!isSupabaseConfigured) return HOOKS;
      return listHooks();
    },
    staleTime: 60_000,
  });
}
