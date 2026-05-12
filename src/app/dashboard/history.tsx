import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { I } from "@/components/icons";
import { useIntakeFeed } from "@/features/intake/useIntake";
import type { Campaign } from "@/types/campaign";

import { usePostsShell } from "./posts-shell";

// ── 11 event types — design 1:1 매핑 ───────────────────────────────────────
type HistType =
  | "copy"
  | "status"
  | "intake"
  | "hook"
  | "variant"
  | "publish"
  | "schedule"
  | "error"
  | "paste"
  | "recycle"
  | "create";

interface HistType_Meta {
  label: string;
  short: string;
  color: string;
}

const HIST_TYPES: Record<HistType, HistType_Meta> = {
  copy: { label: "Copy", short: "CPY", color: "#6e7af0" },
  status: { label: "Status", short: "STS", color: "#a385ff" },
  intake: { label: "Intake", short: "IN", color: "#3acc81" },
  hook: { label: "Hook", short: "HK", color: "#43c7c2" },
  variant: { label: "Variant", short: "VAR", color: "#5e80f5" },
  publish: { label: "Publish", short: "PUB", color: "#3acc81" },
  schedule: { label: "Schedule", short: "SCH", color: "#f5a524" },
  error: { label: "Error", short: "ERR", color: "#ef4f5f" },
  paste: { label: "Paste", short: "PST", color: "#d97cf4" },
  recycle: { label: "Recycle", short: "REC", color: "#f06da5" },
  create: { label: "Create", short: "NEW", color: "#7bcf52" },
};

interface HistEvent {
  id: string;
  type: HistType;
  at: string;
  target?: {
    kind: "post" | "campaign";
    id: string;
    title: string;
    platform?: "NAVER_BLOG" | "NAVER_CAFE";
    campaignId?: string;
  };
  detail: string;
  meta: Record<string, string | number>;
}

// ── time helpers ───────────────────────────────────────────────────────────
function fmtTime(s: string): string {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}
function fmtDayLabel(key: string) {
  const d = new Date(key + "T00:00:00");
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  const tag = diff === 0 ? "오늘" : diff === 1 ? "어제" : diff + "일 전";
  return { date: `${d.getMonth() + 1}/${d.getDate()}`, dow, tag };
}
function fmtRelative(s: string): string {
  const diff = (Date.now() - new Date(s).getTime()) / 1000;
  if (diff < 60) return Math.floor(diff) + "초 전";
  if (diff < 3600) return Math.floor(diff / 60) + "분 전";
  if (diff < 86400) return Math.floor(diff / 3600) + "시간 전";
  return Math.floor(diff / 86400) + "일 전";
}

// ── Derive events from posts + intake_events + campaigns ──────────────────
function deriveEvents(
  posts: ReturnType<typeof usePostsShell>["posts"],
  intake: ReturnType<typeof useIntakeFeed>["data"],
  campaigns: Campaign[],
): HistEvent[] {
  const events: HistEvent[] = [];

  for (const ie of intake ?? []) {
    const base = {
      target: {
        kind: "post" as const,
        id: ie.id,
        title: ie.title,
        platform: ie.platform,
        campaignId: ie.campaignId ?? undefined,
      },
    };
    if (ie.parseStatus === "error") {
      events.push({
        id: "ev_err_" + ie.id,
        type: "error",
        at: ie.at,
        detail: ie.warnings?.join(", ") || "파싱 실패",
        meta: { source: ie.source, parse: ie.parseStatus },
        ...base,
      });
    } else if (ie.source === "hook") {
      events.push({
        id: "ev_hook_" + ie.id,
        type: "hook",
        at: ie.at,
        detail: `Hook 수신 — ${ie.parseStatus.toUpperCase()}`,
        meta: {
          source: "hook",
          parsed: 1,
          campaign: ie.campaignMatched ?? "",
        },
        ...base,
      });
      if (ie.campaignId) {
        events.push({
          id: "ev_intk_" + ie.id,
          type: "intake",
          at: ie.at,
          detail: `${ie.campaignMatched ?? "캠페인 매칭"} · 자동 큐 등록`,
          meta: { source: "hook", parsed: 1 },
          ...base,
        });
      }
    } else {
      events.push({
        id: "ev_pst_" + ie.id,
        type: "paste",
        at: ie.at,
        detail: "Manual paste 등록",
        meta: { source: "manual", parsed: 1 },
        ...base,
      });
    }
  }

  for (const p of posts) {
    const base = {
      target: {
        kind: "post" as const,
        id: p.id,
        title: p.title,
        platform: p.platform,
        campaignId: p.campaignId,
      },
    };
    events.push({
      id: "ev_cre_" + p.id,
      type: "create",
      at: p.createdAt,
      detail: "신규 글 등록",
      meta: { kind: p.kind, platform: p.platform },
      ...base,
    });
    if (p.copyCount > 0) {
      events.push({
        id: "ev_cpy_" + p.id,
        type: "copy",
        at: p.createdAt,
        detail: `복사 ${p.copyCount}회`,
        meta: { count: p.copyCount },
        ...base,
      });
    }
    if (p.status === "published") {
      events.push({
        id: "ev_pub_" + p.id,
        type: "publish",
        at: p.scheduledAt || p.createdAt,
        detail: "발행 마킹",
        meta: { status: "published" },
        ...base,
      });
    } else if (p.status === "scheduled") {
      events.push({
        id: "ev_sch_" + p.id,
        type: "schedule",
        at: p.scheduledAt || p.createdAt,
        detail: "예약 등록",
        meta: { scheduledAt: p.scheduledAt ?? "" },
        ...base,
      });
    }
    if (p.kind === "variant") {
      events.push({
        id: "ev_var_" + p.id,
        type: "variant",
        at: p.createdAt,
        detail: "변형 글 생성",
        meta: { kind: "variant" },
        ...base,
      });
    }
    if (p.kind === "recycled") {
      events.push({
        id: "ev_rec_" + p.id,
        type: "recycle",
        at: p.createdAt,
        detail: "재활용 큐 진입",
        meta: { kind: "recycled" },
        ...base,
      });
    }
  }

  for (const c of campaigns) {
    const at = c.startedAt
      ? c.startedAt.length === 10
        ? c.startedAt + "T00:00:00Z"
        : c.startedAt
      : new Date().toISOString();
    events.push({
      id: "ev_cmp_" + c.id,
      type: "create",
      at,
      target: {
        kind: "campaign",
        id: c.id,
        title: "캠페인: " + c.name,
        campaignId: c.id,
      },
      detail: "캠페인 생성",
      meta: { region: c.region ?? "", industry: c.industry ?? "" },
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events;
}

type RangeKey = "today" | "3d" | "7d" | "30d" | "all";

// ── Main page ─────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { posts, campaigns, doCopy, copyText } = usePostsShell();
  const { data: intake = [] } = useIntakeFeed(200);
  const nav = useNavigate();

  const all = useMemo(
    () => deriveEvents(posts, intake, campaigns),
    [posts, intake, campaigns],
  );

  const cmpById = useMemo(
    () => Object.fromEntries(campaigns.map((c) => [c.id, c])),
    [campaigns],
  );

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<HistType | "all">("all");
  const [cmpFilter, setCmpFilter] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("7d");
  const [focused, setFocused] = useState<string | undefined>(all[0]?.id);

  useEffect(() => {
    if (!focused && all[0]) setFocused(all[0].id);
  }, [all, focused]);

  // KPIs (today)
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const kpi = useMemo(() => {
    const isToday = (s: string) => new Date(s) >= today;
    return {
      copies: all.filter((e) => e.type === "copy" && isToday(e.at)).length,
      published: all.filter((e) => e.type === "publish" && isToday(e.at)).length,
      intake: all.filter((e) => e.type === "intake" && isToday(e.at)).length,
      errors: all.filter((e) => e.type === "error" && isToday(e.at)).length,
      hookOk: all.filter((e) => e.type === "hook" && isToday(e.at)).length,
      lastEvent: all[0] ? fmtRelative(all[0].at) : "—",
    };
  }, [all, today]);

  // Filter
  const filtered = useMemo(() => {
    const cutoff =
      range === "today"
        ? today.getTime()
        : range === "3d"
          ? Date.now() - 3 * 86400000
          : range === "7d"
            ? Date.now() - 7 * 86400000
            : range === "30d"
              ? Date.now() - 30 * 86400000
              : 0;
    return all.filter((e) => {
      if (new Date(e.at).getTime() < cutoff) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (cmpFilter !== "all" && (e.target?.campaignId ?? "") !== cmpFilter)
        return false;
      if (q) {
        const hay = (
          (e.target?.title ?? "") +
          " " +
          e.detail +
          " " +
          (e.target?.id ?? "") +
          " " +
          (e.meta?.source ?? "")
        ).toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [all, q, typeFilter, cmpFilter, range, today]);

  const grouped = useMemo(() => {
    const g: Record<string, HistEvent[]> = {};
    filtered.forEach((e) => {
      const k = e.at.slice(0, 10);
      (g[k] = g[k] || []).push(e);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const flat = useMemo(
    () => grouped.flatMap(([, evs]) => evs),
    [grouped],
  );
  const focusedEvent = flat.find((e) => e.id === focused) || flat[0];

  // Keyboard nav (J/K · ↵)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.tagName === "INPUT" || t?.tagName === "TEXTAREA") return;
      const idx = flat.findIndex((x) => x.id === focused);
      if ((e.key === "j" || e.key === "ArrowDown") && idx < flat.length - 1) {
        e.preventDefault();
        setFocused(flat[idx + 1].id);
      } else if ((e.key === "k" || e.key === "ArrowUp") && idx > 0) {
        e.preventDefault();
        setFocused(flat[idx - 1].id);
      } else if (e.key === "Enter" && focusedEvent) {
        if (focusedEvent.target?.kind === "post") nav("/dashboard/posts");
        else if (focusedEvent.target?.kind === "campaign")
          nav(`/dashboard/campaigns/${focusedEvent.target.id}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flat, focused, focusedEvent, nav]);

  // Type counts for sidebar pills
  const typeCounts = useMemo(() => {
    const c: Record<string, number> = { all: filtered.length };
    Object.keys(HIST_TYPES).forEach((t) => (c[t] = 0));
    filtered.forEach((e) => {
      c[e.type] = (c[e.type] || 0) + 1;
    });
    return c;
  }, [filtered]);

  return (
    <div className="hist-page">
      {/* Header */}
      <div className="hist-head">
        <div className="hist-head-l">
          <div className="hist-head-eyebrow mono">
            AUDIT LOG · /dashboard/history
          </div>
          <div className="hist-head-t">
            History
            <span className="dim"> · {filtered.length}건 표시</span>
            <span className="hist-live">
              <span className="live-dot live">
                <span className="live-pulse" />
              </span>{" "}
              실시간 갱신
            </span>
          </div>
        </div>
        <div className="hist-head-r">
          <button
            className="btn-ghost sm"
            onClick={() =>
              copyText(
                JSON.stringify(filtered, null, 2),
                "history JSON 복사됨",
              )
            }
          >
            <I.Copy size={12} /> CSV 내보내기
          </button>
          <div className="hist-range">
            {(
              [
                ["today", "오늘"],
                ["3d", "3d"],
                ["7d", "7d"],
                ["30d", "30d"],
                ["all", "전체"],
              ] as [RangeKey, string][]
            ).map(([v, l]) => (
              <button
                key={v}
                className={"hr-btn " + (range === v ? "on" : "")}
                onClick={() => setRange(v)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="hist-kpis">
        <KPI
          label="오늘 복사"
          value={kpi.copies}
          unit="건"
          sub="⌘C · ⇧C · ⌥C 모두 포함"
        />
        <KPI
          label="오늘 발행"
          value={kpi.published}
          unit="건"
          sub="published 마킹 기준"
        />
        <KPI
          label="Hook 수집"
          value={kpi.intake}
          unit="건"
          sub={`${kpi.hookOk} hits · 매칭된 건수`}
        />
        <KPI
          label="오늘 에러"
          value={kpi.errors}
          unit="건"
          sub="파싱·인증·rate 합산"
          warn={kpi.errors > 0}
        />
        <KPI
          label="마지막 이벤트"
          value={kpi.lastEvent}
          unit=""
          sub="현재 로그 최상단"
          mono
        />
      </div>

      {/* Body: rail + timeline + detail */}
      <div className="hist-body">
        {/* Filter rail */}
        <aside className="hist-rail">
          <div className="hist-rail-h">
            <span>이벤트 유형</span>
            <span className="hist-rail-total mono">{typeCounts.all}</span>
          </div>
          <button
            className={"hr-type " + (typeFilter === "all" ? "on" : "")}
            onClick={() => setTypeFilter("all")}
          >
            <span className="hr-type-dot all" />
            <span>전체</span>
            <span className="hr-type-c mono">{typeCounts.all}</span>
          </button>
          {(Object.entries(HIST_TYPES) as [HistType, HistType_Meta][]).map(
            ([k, v]) => (
              <button
                key={k}
                className={"hr-type " + (typeFilter === k ? "on" : "")}
                onClick={() => setTypeFilter(k)}
              >
                <span className="hr-type-dot" style={{ background: v.color }} />
                <span>{v.label}</span>
                <span className="hr-type-c mono">{typeCounts[k] || 0}</span>
              </button>
            ),
          )}

          <div className="hist-rail-h" style={{ marginTop: 14 }}>
            <span>캠페인</span>
          </div>
          <button
            className={"hr-type sm " + (cmpFilter === "all" ? "on" : "")}
            onClick={() => setCmpFilter("all")}
          >
            <span className="hr-type-dot all" />
            <span>모든 캠페인</span>
          </button>
          {campaigns.slice(0, 12).map((c) => (
            <button
              key={c.id}
              className={"hr-type sm " + (cmpFilter === c.id ? "on" : "")}
              onClick={() => setCmpFilter(c.id)}
            >
              <span
                className="hr-type-dot"
                style={{ background: c.color }}
              />
              <span>{c.name}</span>
            </button>
          ))}
        </aside>

        {/* Timeline */}
        <main className="hist-main">
          <div className="hist-search">
            <I.Search size={12} />
            <input
              className="hist-q"
              placeholder="제목 · 캠페인 · 소스 · ID 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="kbd-hint mono">J/K · ↵ 점프</span>
          </div>

          <div className="hist-list">
            {grouped.length === 0 && (
              <div className="hist-empty">조건에 맞는 이벤트가 없습니다.</div>
            )}
            {grouped.map(([day, evs]) => {
              const lbl = fmtDayLabel(day);
              return (
                <div key={day} className="hist-day">
                  <div className="hist-day-h">
                    <span className="hist-day-d">{lbl.date}</span>
                    <span className="hist-day-dow">{lbl.dow}</span>
                    <span className="hist-day-tag">{lbl.tag}</span>
                    <span className="hist-day-c mono">{evs.length} events</span>
                    <span className="hist-day-line" />
                  </div>
                  {evs.map((e) => (
                    <HistRow
                      key={e.id}
                      e={e}
                      focused={focused === e.id}
                      onFocus={() => setFocused(e.id)}
                      cmp={cmpById[e.target?.campaignId ?? ""]}
                      onJump={(kind, id) => {
                        if (kind === "post") nav("/dashboard/posts");
                        else if (kind === "campaign")
                          nav(`/dashboard/campaigns/${id}`);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </main>

        {/* Detail panel */}
        <aside className="hist-side">
          {focusedEvent && (
            <EventDetail
              e={focusedEvent}
              cmp={cmpById[focusedEvent.target?.campaignId ?? ""]}
              onJump={(kind, id) => {
                if (kind === "post") nav("/dashboard/posts");
                else if (kind === "campaign")
                  nav(`/dashboard/campaigns/${id}`);
              }}
              doCopy={doCopy}
              copyText={copyText}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Components ─────────────────────────────────────────────────────────────
function KPI({
  label,
  value,
  unit,
  sub,
  warn,
  mono,
}: {
  label: string;
  value: number | string;
  unit: string;
  sub: string;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={"hist-kpi " + (warn ? "warn" : "")}>
      <div className="hist-kpi-l">{label}</div>
      <div className={"hist-kpi-v " + (mono ? "mono" : "")}>
        {value}
        <span className="hist-kpi-u">{unit}</span>
      </div>
      <div className="hist-kpi-s">{sub}</div>
    </div>
  );
}

function HistRow({
  e,
  focused,
  onFocus,
  cmp,
  onJump,
}: {
  e: HistEvent;
  focused: boolean;
  onFocus: () => void;
  cmp?: Campaign;
  onJump: (kind: "post" | "campaign", id: string) => void;
}) {
  const t = HIST_TYPES[e.type];
  return (
    <div
      className={"hist-row " + (focused ? "focused " : "") + "type-" + e.type}
      onClick={onFocus}
      onDoubleClick={() => {
        if (e.target) onJump(e.target.kind, e.target.id);
      }}
    >
      <div className="hist-time mono">{fmtTime(e.at)}</div>
      <div className="hist-type">
        <span
          className="hist-type-bar"
          style={{ background: t.color }}
        />
        <span className="hist-type-tag mono" style={{ color: t.color }}>
          {t.short}
        </span>
      </div>
      <div className="hist-target">
        {cmp && (
          <span
            className="hist-cmp-dot"
            style={{ background: cmp.color }}
          />
        )}
        <span className="hist-target-t">{e.target?.title}</span>
        {e.target?.platform && (
          <span
            className={
              "plat-tag " +
              (e.target.platform === "NAVER_BLOG" ? "blog" : "cafe")
            }
          >
            {e.target.platform === "NAVER_BLOG" ? "BLOG" : "CAFE"}
          </span>
        )}
      </div>
      <div className="hist-detail">{e.detail}</div>
      <div className="hist-source mono">{e.meta?.source ?? ""}</div>
    </div>
  );
}

function EventDetail({
  e,
  cmp,
  onJump,
  copyText,
}: {
  e: HistEvent;
  cmp?: Campaign;
  onJump: (kind: "post" | "campaign", id: string) => void;
  doCopy: ReturnType<typeof usePostsShell>["doCopy"];
  copyText: ReturnType<typeof usePostsShell>["copyText"];
}) {
  const t = HIST_TYPES[e.type];
  const meta = Object.entries(e.meta || {});
  return (
    <div className="hist-det">
      <div className="hist-det-h">
        <span
          className="hist-det-tag mono"
          style={{
            background: t.color + "22",
            color: t.color,
            borderColor: t.color + "55",
          }}
        >
          {t.short}
        </span>
        <span className="hist-det-label">{t.label}</span>
        <span className="hist-det-time mono">{e.at.slice(11, 19)}</span>
      </div>
      <div className="hist-det-title">{e.target?.title}</div>
      <div className="hist-det-detail">{e.detail}</div>

      {cmp && (
        <div className="hist-det-section">
          <div className="hist-det-sl">Campaign</div>
          <div
            className="hist-det-cmp"
            onClick={() => onJump("campaign", cmp.id)}
          >
            <span
              className="hist-cmp-dot lg"
              style={{ background: cmp.color }}
            />
            <span className="hist-det-cmp-n">{cmp.name}</span>
            <span className="hist-det-cmp-r">{cmp.region}</span>
            <span className="link-btn">열기 →</span>
          </div>
        </div>
      )}

      {meta.length > 0 && (
        <div className="hist-det-section">
          <div className="hist-det-sl">Metadata</div>
          <div className="hist-det-meta">
            {meta.map(([k, v]) => (
              <div key={k} className="hist-det-mrow">
                <span className="hist-det-mk mono">{k}</span>
                <span className="hist-det-mv mono">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="hist-det-actions">
        {e.target?.kind === "post" && (
          <button
            className="btn-ghost sm"
            onClick={() => onJump("post", e.target!.id)}
          >
            <I.List size={12} /> 글 열기
          </button>
        )}
        <button
          className="btn-ghost sm"
          onClick={() => copyText(e.id, "이벤트 ID 복사됨")}
        >
          <I.Copy size={12} /> 이벤트 ID 복사
        </button>
      </div>
    </div>
  );
}
