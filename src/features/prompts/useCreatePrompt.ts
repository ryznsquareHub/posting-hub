import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createPrompt, type PromptInput } from "@/lib/api/prompts";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resolveOwnerId } from "@/lib/auth/ownerId";

export function useCreatePrompt() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PromptInput) => {
      if (!isSupabaseConfigured) {
        // mock 모드
        return { id: input.id, name: input.name };
      }
      const ownerId = resolveOwnerId(user?.id);
      if (!ownerId) throw new Error("owner_id 결정 불가");
      return createPrompt(input, ownerId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
