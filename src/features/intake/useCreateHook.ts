import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createHook } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveOwnerId } from "@/lib/auth/ownerId";
import type { HookEndpoint } from "@/types/intake";

export function useCreateHook() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (args: { name: string; boundPrompts?: string[] }): Promise<HookEndpoint> => {
      if (!isSupabaseConfigured) {
        return {
          id: "hk_mock_" + Math.random().toString(36).slice(2, 8),
          name: args.name,
          url: "https://mock.supabase.co/functions/v1/hook-intake?t=mocktoken",
          protocol: "POST · JSON",
          status: "live",
          uptime: 1,
          lastPingAt: null,
          secret: "(server-side)",
          authType: "Bearer",
          receivedToday: 0,
          errorsToday: 0,
          p50LatencyMs: 0,
          boundPrompts: args.boundPrompts ?? [],
        };
      }
      const ownerId = resolveOwnerId(user?.id);
      if (!ownerId) throw new Error("owner_id 결정 불가");
      return createHook({ name: args.name, ownerId, boundPrompts: args.boundPrompts });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hooks"] });
    },
  });
}
