import { z } from "zod";

import { supabase } from "../supabase/client";
import { mapPost, toPostInsert } from "../supabase/mappers";
import type { Post, PostStatus, Platform, PostKind } from "@/types/post";

const PostStatusSchema = z.enum([
  "draft",
  "ready",
  "scheduled",
  "published",
  "archived",
]);

const PlatformSchema = z.enum(["NAVER_BLOG", "NAVER_CAFE"]);
const KindSchema = z.enum(["original", "variant", "recycled"]);

export const PostInputSchema = z.object({
  id: z.string().min(1),
  campaignId: z.string().min(1),
  title: z.string().min(1).max(500),
  body: z.string().min(1),
  platform: PlatformSchema,
  kind: KindSchema.default("original"),
  keywords: z.array(z.string()).default([]),
  region: z.string().optional(),
  industry: z.string().optional(),
  cta: z.string().optional(),
  memo: z.string().optional(),
  status: PostStatusSchema.default("ready"),
  copyCount: z.number().int().nonnegative().default(0),
  recyclable: z.boolean().default(false),
  scheduledAt: z.string().nullable().optional(),
});

export type PostInput = z.infer<typeof PostInputSchema>;

export interface PostsFilterInput {
  campaignId?: string;
  status?: PostStatus | "all";
  platform?: Platform | "all";
  kind?: PostKind | "all";
  recyclable?: boolean;
  limit?: number;
}

export async function listPosts(filter: PostsFilterInput = {}): Promise<Post[]> {
  const sb = supabase();
  let q = sb.from("posts").select("*").order("created_at", { ascending: false });
  if (filter.campaignId) q = q.eq("campaign_id", filter.campaignId);
  if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  if (filter.platform && filter.platform !== "all")
    q = q.eq("platform", filter.platform);
  if (filter.kind && filter.kind !== "all") q = q.eq("kind", filter.kind);
  if (filter.recyclable !== undefined) q = q.eq("recyclable", filter.recyclable);
  if (filter.limit) q = q.limit(filter.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapPost);
}

export async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase()
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data) : null;
}

export async function createPost(
  input: PostInput,
  ownerId: string,
): Promise<Post> {
  const parsed = PostInputSchema.parse(input);
  const { data, error } = await supabase()
    .from("posts")
    .insert(
      toPostInsert({
        ...parsed,
        ownerId,
      }),
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
): Promise<Post> {
  PostStatusSchema.parse(status);
  const { data, error } = await supabase()
    .from("posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function incrementCopyCount(id: string): Promise<Post> {
  const sb = supabase();
  const { data: current, error: getErr } = await sb
    .from("posts")
    .select("copy_count, status")
    .eq("id", id)
    .single();
  if (getErr) throw getErr;
  const nextStatus =
    current.status === "ready" || current.status === "draft"
      ? "published"
      : current.status;
  const { data, error } = await sb
    .from("posts")
    .update({
      copy_count: (current.copy_count ?? 0) + 1,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapPost(data);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase().from("posts").delete().eq("id", id);
  if (error) throw error;
}
