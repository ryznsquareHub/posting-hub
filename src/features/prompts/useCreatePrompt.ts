import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createPrompt, type PromptInput } from "@/lib/api/prompts";
import { useAuth } from "@/lib/auth/AuthProvider";

export function useCreatePrompt() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: PromptInput) => {
      if (!isSupabaseConfigured) {
        // mock 모드
        return { id: input.id, name: input.name };
      }
      if (!user?.id) throw new Error("로그인 필요");
      return createPrompt(input, user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}
