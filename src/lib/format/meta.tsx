import { STATUSES, KINDS, PLATFORMS } from "@/data/seed";
import type { PostStatus, Platform, PostKind } from "@/types/post";

export function statusMeta(key: PostStatus) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}

export function kindMeta(key: PostKind) {
  return KINDS.find((k) => k.key === key) ?? { label: key, tone: "#888" };
}

export function platMeta(key: Platform) {
  return PLATFORMS.find((p) => p.key === key) ?? PLATFORMS[0];
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 디자인 jsx 의 <PlatTag/> 1:1 */
export function PlatTag({
  platform,
  mode = "short",
}: {
  platform: Platform;
  mode?: "short" | "full";
}) {
  const m = platMeta(platform);
  const isCafe = platform === "NAVER_CAFE";
  return (
    <span className={"plat-tag " + (isCafe ? "cafe" : "blog")}>
      {mode === "short" ? m.short : m.label}
    </span>
  );
}

/** 디자인 jsx 의 <LiveDot/> */
export function LiveDot({
  status,
}: {
  status: "live" | "review" | "off" | boolean;
}) {
  const cls =
    status === true || status === "live"
      ? "live"
      : status === "review"
        ? "review"
        : "off";
  return (
    <span className={"live-dot " + cls}>
      <span className="live-pulse" />
    </span>
  );
}

/** 디자인 jsx 의 <StatusPill/> */
export function StatusPill({
  status,
  size = "sm",
}: {
  status: PostStatus;
  size?: "sm" | "lg";
}) {
  const m = statusMeta(status);
  return (
    <span className={"pill " + size}>
      <span className="pill-dot" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
}
