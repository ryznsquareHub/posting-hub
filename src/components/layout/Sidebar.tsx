import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import { I } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useAutomation } from "@/features/intake/useAutomation";
import { NewCampaignModal } from "@/features/campaigns/NewCampaignModal";
import type { Campaign } from "@/types/campaign";
import type { Post } from "@/types/post";

interface QueueCounts {
  today: number;
  scheduled: number;
  ready: number;
  recent: number;
  recyclable: number;
}

interface SidebarProps {
  campaigns: Campaign[];
  posts: Post[];
  queueCounts: QueueCounts;
  activeQuickFilter: string | null;
  onQuickFilter: (key: string) => void;
}

const NAV_ROUTES = {
  overview:  { path: "/dashboard",                   label: "Today",      icon: I.Home,     showBadge: false, live: false },
  posts:     { path: "/dashboard/posts",             label: "All posts",  icon: I.List,     showBadge: true,  live: false },
  library:   { path: "/dashboard/prompt-library",    label: "Workflows",  icon: I.Zap,      showBadge: false, live: false },
  import:    { path: "/dashboard/import",            label: "Intake",     icon: I.Inbox,    showBadge: false, live: true  },
  templates: { path: "/dashboard/templates",         label: "Templates",  icon: I.Layers,   showBadge: false, live: false },
} as const;

export function Sidebar({
  campaigns,
  posts,
  queueCounts,
  activeQuickFilter,
  onQuickFilter,
}: SidebarProps) {
  const nav = useNavigate();
  const location = useLocation();
  const params = useParams<{ id?: string }>();
  const { user } = useAuth();
  const auto = useAutomation();
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);

  // Campaign post counts
  const cCounts: Record<string, number> = {};
  for (const p of posts) {
    cCounts[p.campaignId] = (cCounts[p.campaignId] ?? 0) + 1;
  }

  const isActiveRoute = (path: string) =>
    location.pathname === path ||
    (path === "/dashboard/posts" && location.pathname.startsWith("/dashboard/posts"));

  const routeId = location.pathname.startsWith("/dashboard/campaign/")
    ? params.id ?? null
    : null;

  const userInitials = user?.email
    ? user.email.split("@")[0].split(/[.\-_]/).map((s) => s[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "U"
    : "?";
  const userLabel = user?.email?.split("@")[0] ?? "—";
  const userMail = user?.email ?? "—";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 4v16M5 4h7a4 4 0 0 1 0 8H5" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">PostingHub</div>
          <div className="brand-sub">Naver ops · v0.5</div>
        </div>
      </div>

      {/* Workspace nav */}
      <div className="side-section">
        {(Object.keys(NAV_ROUTES) as (keyof typeof NAV_ROUTES)[]).map((k) => {
          const it = NAV_ROUTES[k];
          const Ico = it.icon;
          return (
            <button
              key={k}
              className={"side-item " + (isActiveRoute(it.path) ? "active" : "")}
              onClick={() => nav(it.path)}
            >
              <Ico size={13} />
              <span>{it.label}</span>
              {it.live && auto.hookLive && (
                <span className="side-live">
                  <span className="live-dot live">
                    <span className="live-pulse" />
                  </span>
                </span>
              )}
              {it.showBadge && <span className="side-badge">{posts.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Automation status block */}
      <div className="side-section">
        <div className="side-section-h">
          <span>Automation</span>
          <span className="side-section-hint">G W</span>
        </div>
        <div className="side-auto">
          <div className="side-auto-row">
            <span className={"live-dot " + (auto.hookLive ? "live" : "off")}>
              <span className="live-pulse" />
            </span>
            <span>Hooks</span>
            <span className="side-auto-v mono">{auto.hookCount}</span>
          </div>
          <div className="side-auto-row">
            <span className="dot" style={{ background: "#3acc81" }} />
            <span>Auto Parse</span>
            <span className="side-auto-v mono">{auto.autoParseOn}</span>
          </div>
          <div className="side-auto-row">
            <span className="dot" style={{ background: "#5e80f5" }} />
            <span>24h 수집</span>
            <span className="side-auto-v mono">{auto.intake24h}</span>
          </div>
          {auto.errorsToday > 0 && (
            <div className="side-auto-row err">
              <span className="dot" style={{ background: "#ff6e6e" }} />
              <span>에러</span>
              <span className="side-auto-v mono">{auto.errorsToday}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick filters / 운영 큐 */}
      <div className="side-section">
        <div className="side-section-h">
          <span>운영 큐</span>
          <span className="side-section-hint">G P</span>
        </div>
        {([
          { key: "today",      label: "오늘 발행",   color: "#f5a524", count: queueCounts.today },
          { key: "scheduled",  label: "예약 대기",   color: "#5e80f5", count: queueCounts.scheduled },
          { key: "ready",      label: "발행 대기",   color: "#9ea0a8", count: queueCounts.ready },
          { key: "recent",     label: "최근 복사",   color: "#3acc81", count: queueCounts.recent },
          { key: "recyclable", label: "재활용 가능", color: "#a385ff", count: queueCounts.recyclable },
        ] as const).map((q) => (
          <button
            key={q.key}
            className={"side-item small " + (activeQuickFilter === q.key ? "active" : "")}
            onClick={() => onQuickFilter(q.key)}
          >
            <span className="dot" style={{ background: q.color }} />
            {q.label}
            <span className="side-badge">{q.count}</span>
          </button>
        ))}
      </div>

      {/* Campaigns */}
      <div className="side-section campaigns-section">
        <div className="side-section-h">
          <span>Campaigns</span>
          <button
            className="side-section-add"
            title="새 캠페인 (Cmd+Shift+N)"
            onClick={() => setNewCampaignOpen(true)}
          >
            ＋
          </button>
        </div>
        <div className="campaign-list">
          {campaigns.map((c) => (
            <button
              key={c.id}
              className={"side-campaign " + (routeId === c.id ? "active" : "")}
              onClick={() => nav(`/dashboard/campaign/${c.id}`)}
            >
              <span className="cmp-color" style={{ background: c.color }} />
              <span className="cmp-name">{c.name}</span>
              <span className="cmp-count">{cCounts[c.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="side-foot">
        <button
          className={"side-item " + (location.pathname === "/dashboard/settings" ? "active" : "")}
          onClick={() => nav("/dashboard/settings")}
        >
          <I.Settings size={13} />
          <span>Settings</span>
        </button>
        <div className="user-row">
          <div className="avatar">{userInitials}</div>
          <div className="user-meta">
            <div className="user-name">{userLabel}</div>
            <div className="user-mail">{userMail}</div>
          </div>
        </div>
      </div>
      <NewCampaignModal
        open={newCampaignOpen}
        onClose={() => setNewCampaignOpen(false)}
        onCreated={(id) => nav(`/dashboard/campaign/${id}`)}
      />
    </aside>
  );
}
