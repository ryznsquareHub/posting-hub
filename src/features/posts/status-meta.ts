import type { PostStatus, PostKind } from "@/types/post";

export interface StatusMeta {
  key: PostStatus;
  label: string;
  dot: string;
  hotkey: string;
}

export const STATUSES: StatusMeta[] = [
  { key: "draft",     label: "초안",     dot: "var(--status-draft)",     hotkey: "1" },
  { key: "ready",     label: "발행대기", dot: "var(--status-ready)",     hotkey: "2" },
  { key: "scheduled", label: "예약",     dot: "var(--status-scheduled)", hotkey: "3" },
  { key: "published", label: "발행완료", dot: "var(--status-published)", hotkey: "4" },
  { key: "archived",  label: "보관",     dot: "var(--status-archived)",  hotkey: "5" },
];

export function statusMeta(key: PostStatus): StatusMeta {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}

export const STATUS_BY_HOTKEY: Record<string, PostStatus> = Object.fromEntries(
  STATUSES.map((s) => [s.hotkey, s.key]),
);

export const PLATFORM_SHORT: Record<string, string> = {
  NAVER_BLOG: "BLOG",
  NAVER_CAFE: "CAFE",
};

export const KIND_META: Record<PostKind, { label: string; tone: string }> = {
  original: { label: "원본",   tone: "#9ea0a8" },
  variant:  { label: "변형",   tone: "#a385ff" },
  recycled: { label: "재활용", tone: "#3acc81" },
};
