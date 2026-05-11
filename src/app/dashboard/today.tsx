import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { I } from "@/components/icons";
import { useAutomation } from "@/features/intake/useAutomation";
import { useIntakeFeed } from "@/features/intake/useIntake";
import { LiveDot, PlatTag, timeAgo } from "@/lib/format/meta";
import type { Post } from "@/types/post";

import { usePostsShell } from "./posts-shell";

export default function TodayPage() {
  const { posts, campaigns, doCopy, setStatus } = usePostsShell();
  const nav = useNavigate();
  const auto = useAutomation();
  const { data: feedData } = useIntakeFeed(20);
  const feed = (feedData ?? []).slice(0, 5);

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  const groups = useMemo(() => {
    const ready = posts.filter((p) => p.status === "ready");
    const sched = posts
      .filter((p) => p.status === "scheduled" && p.scheduledAt)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime(),
      );
    const todaySch = sched.filter((p) => p.scheduledAt!.slice(0, 10) === todayKey);
    const recyc = posts
      .filter((p) => p.recyclable && p.status === "published")
      .slice(0, 5);
    return { ready, sched, todaySch, recyc };
  }, [posts, todayKey]);

  const cmpMap = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c])),
    [campaigns],
  );

  // 단순화: 모든 row click 은 /dashboard/posts 이동 (focused 자동 매핑은 다음 사이클)

  const stats = [
    {
      label: "오늘 올릴 글",
      value: groups.ready.length + groups.todaySch.length,
      accent: "ready",
      sub: `발행대기 ${groups.ready.length} · 오늘 예약 ${groups.todaySch.length}`,
    },
    {
      label: "AI 자동 수집 24h",
      value: auto.intake24h,
      accent: "sched",
      sub: `Queue 등록 ${auto.queuedToday} · 에러 ${auto.errorsToday}`,
    },
    {
      label: "예약 대기",
      value: groups.sched.length,
      accent: "cnt",
      sub: groups.todaySch.length
        ? `오늘 ${groups.todaySch.length}건`
        : "오늘 예약 없음",
    },
    {
      label: "재활용 가능",
      value: groups.recyc.length,
      accent: "rec",
      sub: "30일+ 발행완료",
    },
  ];

  return (
    <div className="today-page">
      <div className="t-head">
        <div>
          <h1>오늘의 운영 큐</h1>
          <div className="t-sub">
            {now.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "long",
            })}{" "}
            · 처리해야 할 콘텐츠 {groups.ready.length + groups.todaySch.length}건
          </div>
        </div>
        <div className="t-head-actions">
          <div
            className="auto-pill"
            title={"마지막 hook: " + timeAgo(auto.lastHookAt)}
          >
            <LiveDot status={auto.hookLive ? "live" : "off"} />
            <span>Auto Import {auto.hookLive ? "Active" : "Off"}</span>
            <span className="auto-pill-sep">·</span>
            <span className="mono">{auto.hookCount}</span>
            <span className="mute">hooks</span>
          </div>
          <button
            className="btn-ghost xs"
            onClick={() => nav("/dashboard/prompt-library")}
          >
            <I.Zap size={11} /> Workflows
          </button>
          <button className="btn-primary" onClick={() => nav("/dashboard/posts")}>
            <I.Zap size={12} /> 운영 시작{" "}
            <span className="kbd small invert">⏎</span>
          </button>
        </div>
      </div>

      <div className="t-stats">
        {stats.map((s) => (
          <div key={s.label} className={"t-stat " + s.accent}>
            <div className="t-stat-l">{s.label}</div>
            <div className="t-stat-v">{s.value}</div>
            <div className="t-stat-s">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="t-grid">
        {/* 발행 대기 */}
        <section className="t-col">
          <header className="t-col-h">
            <h3>
              <span className="dot" style={{ background: "#3b82f6" }} /> 발행 대기{" "}
              <span className="t-c">{groups.ready.length}</span>
            </h3>
            <button className="t-jump" onClick={() => nav("/dashboard/posts")}>
              전체
            </button>
          </header>
          <div className="t-list">
            {groups.ready.slice(0, 8).map((p) => (
              <TodayRow
                key={p.id}
                post={p}
                campaign={cmpMap[p.campaignId]}
                onOpen={() => nav("/dashboard/posts")}
                onCopy={() => doCopy(p)}
                onPublish={() => setStatus(p.id, "published")}
              />
            ))}
            {!groups.ready.length && (
              <div className="t-empty">발행 대기 글이 없습니다</div>
            )}
          </div>
        </section>

        {/* AI 자동 수집 라이브 */}
        <section className="t-col">
          <header className="t-col-h">
            <h3>
              <LiveDot status={auto.hookLive ? "live" : "off"} /> AI 자동 수집 라이브{" "}
              <span className="t-c">{feed.length}</span>
            </h3>
            <button className="t-jump" onClick={() => nav("/dashboard/import")}>
              Intake 열기 <span className="kbd small">G I</span>
            </button>
          </header>
          <div className="t-list">
            {feed.map((f) => (
              <div className={"t-row feed-row " + f.parseStatus} key={f.id}>
                <div className="t-row-l">
                  <span className={"feed-src " + f.source}>
                    {f.source === "hook" ? "HOOK" : "MAN"}
                  </span>
                  <span className="t-row-title">{f.title}</span>
                </div>
                <div className="t-row-r">
                  <span className="t-row-time mute">{timeAgo(f.at)}</span>
                </div>
              </div>
            ))}
            {!feed.length && (
              <div className="t-empty">최근 수집 내역이 없습니다</div>
            )}
          </div>
        </section>

        {/* 오늘 예약 */}
        <section className="t-col">
          <header className="t-col-h">
            <h3>
              <span className="dot" style={{ background: "#a385ff" }} /> 오늘 예약{" "}
              <span className="t-c">{groups.todaySch.length}</span>
            </h3>
            <button className="t-jump" onClick={() => nav("/dashboard/posts")}>
              전체
            </button>
          </header>
          <div className="t-list">
            {groups.todaySch.map((p) => {
              const c = cmpMap[p.campaignId];
              const t = new Date(p.scheduledAt!);
              return (
                <div
                  className="t-row"
                  key={p.id}
                  onClick={() => nav("/dashboard/posts")}
                >
                  <div className="t-row-l">
                    <span className="t-row-time">
                      {t.getHours().toString().padStart(2, "0")}:
                      {t.getMinutes().toString().padStart(2, "0")}
                    </span>
                    {c && (
                      <span
                        className="cmp-color"
                        style={{ background: c.color }}
                      />
                    )}
                    <PlatTag platform={p.platform} />
                    <span className="t-row-title">{p.title}</span>
                  </div>
                  <div className="t-row-r">
                    <button
                      className="btn-copy xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        doCopy(p);
                      }}
                    >
                      <I.Copy size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!groups.todaySch.length && (
              <div className="t-empty">예약된 글이 없습니다</div>
            )}
          </div>
        </section>

        {/* 재활용 가능 */}
        <section className="t-col">
          <header className="t-col-h">
            <h3>
              <span className="dot" style={{ background: "#f59e0b" }} /> 재활용 가능{" "}
              <span className="t-c">{groups.recyc.length}</span>
            </h3>
            <button className="t-jump" onClick={() => nav("/dashboard/posts")}>
              전체
            </button>
          </header>
          <div className="t-list">
            {groups.recyc.map((p) => (
              <TodayRow
                key={p.id}
                post={p}
                campaign={cmpMap[p.campaignId]}
                onOpen={() => nav("/dashboard/posts")}
                onCopy={() => doCopy(p)}
              />
            ))}
            {!groups.recyc.length && (
              <div className="t-empty">재활용 후보가 없습니다</div>
            )}
          </div>
        </section>
      </div>

      <section className="t-cmps">
        <header className="t-col-h">
          <h3>캠페인별 큐 상태</h3>
          <button className="t-jump" onClick={() => nav("/dashboard/posts")}>
            모든 글
          </button>
        </header>
        <div className="t-cmps-grid">
          {campaigns.map((c) => {
            const cp = posts.filter((p) => p.campaignId === c.id);
            const ready = cp.filter((p) => p.status === "ready").length;
            const sched = cp.filter((p) => p.status === "scheduled").length;
            const pub = cp.filter((p) => p.status === "published").length;
            return (
              <div
                className="t-cmp"
                key={c.id}
                onClick={() => nav(`/dashboard/campaign/${c.id}`)}
              >
                <div className="t-cmp-h">
                  <span
                    className="cmp-color big"
                    style={{ background: c.color }}
                  />
                  <div>
                    <div className="t-cmp-n">{c.name}</div>
                    <div className="t-cmp-meta">
                      {c.region} · {c.industry}
                    </div>
                  </div>
                </div>
                <div className="t-cmp-stats">
                  <span className="t-cmp-stat ready">
                    <b>{ready}</b>
                    <i>대기</i>
                  </span>
                  <span className="t-cmp-stat sched">
                    <b>{sched}</b>
                    <i>예약</i>
                  </span>
                  <span className="t-cmp-stat pub">
                    <b>{pub}</b>
                    <i>완료</i>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TodayRow({
  post,
  campaign,
  onOpen,
  onCopy,
  onPublish,
}: {
  post: Post;
  campaign?: { color: string };
  onOpen: () => void;
  onCopy: () => void;
  onPublish?: () => void;
}) {
  return (
    <div className="t-row" onClick={onOpen}>
      <div className="t-row-l">
        {campaign && (
          <span className="cmp-color" style={{ background: campaign.color }} />
        )}
        <PlatTag platform={post.platform} />
        <span className="t-row-title">{post.title}</span>
      </div>
      <div className="t-row-r">
        <button
          className="btn-copy xs"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
        >
          <I.Copy size={10} />
        </button>
        {onPublish && (
          <button
            className="btn-icon xs"
            title="발행완료"
            onClick={(e) => {
              e.stopPropagation();
              onPublish();
            }}
          >
            <I.Check size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
