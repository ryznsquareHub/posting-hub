export type PostStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "published"
  | "archived";

export type Platform = "NAVER_BLOG" | "NAVER_CAFE";

export type PostKind = "original" | "variant" | "recycled";

export interface Post {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  platform: Platform;
  kind: PostKind;
  keywords: string[];
  region?: string;
  industry?: string;
  cta?: string;
  memo?: string;
  status: PostStatus;
  copyCount: number;
  recyclable: boolean;
  scheduledAt?: string | null;
  createdAt: string;
  /** 1-click 복사 후 1.4s 동안만 truthy — row flash 트리거 */
  _justCopied?: number | null;
}
