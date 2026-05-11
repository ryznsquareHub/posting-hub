import { useMutation, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { PostTemplate } from "@/types/prompt";

export interface NewTemplateInput {
  name: string;
  platform: "NAVER_BLOG" | "NAVER_CAFE";
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: NewTemplateInput): Promise<PostTemplate> => {
      if (!isSupabaseConfigured) {
        return {
          id: "t_mock_" + Math.random().toString(36).slice(2, 6),
          name: input.name,
          platform: input.platform,
          uses: 0,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }
      if (!user?.id) throw new Error("로그인 필요");
      const id = "t_" + Math.random().toString(36).slice(2, 8);
      const { data, error } = await supabase()
        .from("templates")
        .insert({
          id,
          owner_id: user.id,
          name: input.name,
          platform: input.platform,
          uses: 0,
          updated_at: new Date().toISOString(),
        })
        .select("*")
        .single();
      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        platform: (data.platform ?? "NAVER_BLOG") as "NAVER_BLOG" | "NAVER_CAFE",
        uses: data.uses ?? 0,
        updatedAt: data.updated_at ?? "",
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}
