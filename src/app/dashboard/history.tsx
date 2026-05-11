import { useNavigate } from "react-router-dom";

import { I } from "@/components/icons";
import { PlatTag, statusMeta, timeAgo } from "@/lib/format/meta";
import { usePostsShell } from "./posts-shell";

/**
 * History — 복사 기록 + 발행/예약 변경 이력.
 * Phase 3 mock: posts.copyCount > 0 인 글들 + scheduled/published 상태인 글들을
 * 시간순으로 노출. Phase 2 supabase 연결 시 별도 audit_log 테이블 추천.
 */
export default function HistoryPage() {
  const { posts, campaigns, doCopy } = usePostsShell();
  const nav = useNavigate();

  // 임시로 copyCount > 0 인 글 + scheduled / published 인 글을 합쳐 시간순.
  const entries = [
    ...posts
      .filter((p) => p.copyCount > 0)
      .map((p) => ({
        type: "copy" as const,
        post: p,
        at: p.scheduledAt ?? p.createdAt,
        label: `${p.copyCount}회 복사됨`,
      })),
    ...posts
      .filter((p) => p.status === "published" || p.status === "scheduled")
      .map((p) => ({
        type: "status" as const,
        post: p,
        at: p.scheduledAt ?? p.createdAt,
        label: statusMeta(p.status).label,
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="today-page">
      <div className="t-head">
        <div>
          <h1>History</h1>
          <div className="t-sub">
            복사 · 발행 · 예약 변경 기록 (최근순)
          </div>
        </div>
        <div className="t-head-actions">
          <button
            className="btn-ghost xs"
            onClick={() => nav("/dashboard/posts")}
          >
            <I.List size={11} /> Posts
          </button>
        </div>
      </div>

      <section className="t-col" style={{ maxWidth: 900 }}>
        <div className="t-list">
          {entries.length === 0 && (
            <div className="t-empty">아직 기록이 없습니다</div>
          )}
          {entries.map((e, i) => {
            const c = campaigns.find((x) => x.id === e.post.campaignId);
            const sm = statusMeta(e.post.status);
            return (
              <div
                className="t-row"
                key={`${e.type}-${e.post.id}-${i}`}
                onClick={() => nav("/dashboard/posts")}
              >
                <div className="t-row-l">
                  <span className="dot" style={{ background: sm.dot }} />
                  {e.type === "copy" ? (
                    <span className="feed-src manual">COPY</span>
                  ) : (
                    <span className={"feed-src " + (e.post.status === "published" ? "hook" : "manual")}>
                      {e.post.status === "published" ? "PUB" : "SCHED"}
                    </span>
                  )}
                  {c && (
                    <span
                      className="cmp-color"
                      style={{ background: c.color }}
                    />
                  )}
                  <PlatTag platform={e.post.platform} />
                  <span className="t-row-title">{e.post.title}</span>
                </div>
                <div className="t-row-r">
                  <span className="t-row-time mute">{e.label}</span>
                  <span className="t-row-time mute">{timeAgo(e.at)}</span>
                  <button
                    className="btn-copy xs"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      doCopy(e.post);
                    }}
                  >
                    <I.Copy size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
