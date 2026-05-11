import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  listPosts,
  updatePostStatus,
  incrementCopyCount,
  type PostsFilterInput,
} from "@/lib/api/posts";
import { POSTS_SEED } from "@/data/seed";
import type { Post, PostStatus } from "@/types/post";

const POSTS_KEY = (filter?: PostsFilterInput) =>
  ["posts", filter ?? null] as const;

export function usePosts(filter?: PostsFilterInput) {
  return useQuery({
    queryKey: POSTS_KEY(filter),
    queryFn: async (): Promise<Post[]> => {
      if (!isSupabaseConfigured) return applyClientFilter(POSTS_SEED, filter);
      return listPosts(filter);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useUpdatePostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PostStatus }) => {
      if (!isSupabaseConfigured) {
        return Promise.resolve({ id, status } as { id: string; status: PostStatus });
      }
      return updatePostStatus(id, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useCopyPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!isSupabaseConfigured) {
        return Promise.resolve({ id });
      }
      return incrementCopyCount(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Mock 모드 한정 — Supabase 미구성 시 클라이언트 측 filter */
function applyClientFilter(posts: Post[], f?: PostsFilterInput): Post[] {
  if (!f) return posts;
  return posts.filter((p) => {
    if (f.campaignId && p.campaignId !== f.campaignId) return false;
    if (f.status && f.status !== "all" && p.status !== f.status) return false;
    if (f.platform && f.platform !== "all" && p.platform !== f.platform)
      return false;
    if (f.kind && f.kind !== "all" && p.kind !== f.kind) return false;
    if (f.recyclable !== undefined && p.recyclable !== f.recyclable) return false;
    return true;
  });
}
