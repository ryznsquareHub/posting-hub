import { toast } from "sonner";

import { I } from "@/components/icons";
import { STATUSES, KINDS } from "@/data/seed";
import { useDeletePost } from "./usePosts";
import type { Campaign } from "@/types/campaign";
import type { Post } from "@/types/post";

interface PostRowProps {
  post: Post;
  campaign?: Campaign;
  focused: boolean;
  selected: boolean;
  density: "compact" | "comfy";
  copyMode: "inline" | "panel" | "modal";
  onFocus: (id: string) => void;
  onSelect: (id: string) => void;
  onCopy: (p: Post) => void;
}

function statusMeta(key: string) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}

function kindMeta(key: string) {
  return KINDS.find((k) => k.key === key) ?? { label: key, tone: "#888" };
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function PlatTag({ platform }: { platform: Post["platform"] }) {
  const isCafe = platform === "NAVER_CAFE";
  return (
    <span className={"plat-tag " + (isCafe ? "cafe" : "blog")}>
      {isCafe ? "CAFE" : "BLOG"}
    </span>
  );
}

export function PostRow({
  post,
  campaign,
  focused,
  selected,
  density,
  copyMode,
  onFocus,
  onSelect,
  onCopy,
}: PostRowProps) {
  const m = statusMeta(post.status);
  const km = kindMeta(post.kind);
  const del = useDeletePost();
  const imgCount = (post.body.match(/\[사진\d+\s*[—\-]\s*img:/g) ?? []).length;
  const firstImgUrl = post.body.match(/\[사진\d+\s*[—\-]\s*img:\s*(https?:\/\/[^\]\s]+)/)?.[1];

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`'${post.title.slice(0, 30)}…' 삭제하시겠습니까?`)) return;
    del.mutate(post.id, {
      onSuccess: () => toast.success("삭제됨"),
      onError: (err) => toast.error((err as Error).message ?? "삭제 실패"),
    });
  };
  const justCopied = Boolean(post._justCopied);

  return (
    <div
      data-row-id={post.id}
      className={
        "row " +
        density +
        (focused ? " focused" : "") +
        (selected ? " selected" : "") +
        (justCopied ? " just-copied" : "")
      }
      onClick={() => onFocus(post.id)}
      onDoubleClick={() => onCopy(post)}
    >
      <div
        className="row-check"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(post.id);
        }}
      >
        <span className={"chkbx " + (selected ? "on" : "")}>
          {selected && <I.Check size={10} strokeWidth={2.4} />}
        </span>
      </div>

      <div className="row-status">
        <span className="dot" style={{ background: m.dot }} title={m.label} />
      </div>

      <div className="row-cmp">
        {campaign && <span className="cmp-name-cell">{campaign.name}</span>}
      </div>

      <div className="row-title">
        <div className="row-title-text">
          {firstImgUrl && (
            <div
              className="row-thumb-wrap"
              title={`이미지 ${imgCount}장 포함`}
            >
              <img
                src={firstImgUrl}
                alt=""
                className="row-thumb"
                loading="lazy"
              />
              {imgCount > 1 && (
                <span className="row-thumb-badge">{imgCount}</span>
              )}
            </div>
          )}
          <span>{post.title}</span>
        </div>
        <div className="row-meta">
          <PlatTag platform={post.platform} />
          <span className="meta-sep">·</span>
          <span className="meta-mute">{post.industry}</span>
          {imgCount > 0 && (
            <span className="row-imgs" title={`이미지 ${imgCount}장 포함`}>
              <I.Image size={10} /> {imgCount}
            </span>
          )}
          {post.keywords.slice(0, 2).map((k) => (
            <span key={k} className="kw">
              #{k}
            </span>
          ))}
          {post.recyclable && <span className="chip-rec">재활용</span>}
          {post.memo && (
            <span className="memo-flag" title={post.memo}>
              <I.Edit size={9} /> 메모
            </span>
          )}
        </div>
      </div>

      <div className="row-kind">
        <span
          className="kind-tag"
          style={{ color: km.tone, borderColor: km.tone + "55" }}
        >
          {km.label}
        </span>
      </div>

      <div className="row-status-text">{m.label}</div>

      <div className="row-copies">
        <I.Copy size={10} />
        <span>{post.copyCount}</span>
      </div>

      <div className="row-time">
        {post.scheduledAt ? (
          (() => {
            const d = new Date(post.scheduledAt);
            const mm = d.getMonth() + 1;
            const dd = d.getDate();
            const hh = String(d.getHours()).padStart(2, "0");
            const mi = String(d.getMinutes()).padStart(2, "0");
            return (
              <span className="sched">
                <I.Calendar size={10} /> {mm}/{dd} {hh}:{mi}
              </span>
            );
          })()
        ) : (
          <span className="time-mute">{timeAgo(post.createdAt)}</span>
        )}
      </div>

      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
        {copyMode === "inline" && (
          <button
            className={"btn-copy " + (justCopied ? "ok" : "")}
            onClick={() => onCopy(post)}
          >
            {justCopied ? (
              <>
                <I.Check size={11} strokeWidth={2.4} /> 복사됨
              </>
            ) : (
              <>
                <I.Copy size={11} /> 복사
              </>
            )}
          </button>
        )}
        <button className="btn-icon" title="삭제" onClick={onDelete}>
          <I.Trash size={12} />
        </button>
      </div>
    </div>
  );
}
