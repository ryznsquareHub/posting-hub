import { useLocation, useNavigate, useParams } from "react-router-dom";

import { I } from "@/components/icons";
import { campaignById } from "@/data/seed";

const LABELS: Record<string, string> = {
  "/dashboard":                "Today",
  "/dashboard/posts":          "All posts",
  "/dashboard/templates":      "Templates",
  "/dashboard/prompt-library": "Workflows",
  "/dashboard/import":         "Intake",
  "/dashboard/history":        "History",
  "/dashboard/settings":       "Settings",
};

interface TopbarProps {
  kbdHint?: string | null;
  onCmdK?: () => void;
}

export function Topbar({ kbdHint, onCmdK }: TopbarProps) {
  const location = useLocation();
  const params = useParams();
  const nav = useNavigate();

  const breadcrumb = (() => {
    if (location.pathname.startsWith("/dashboard/campaign/") && params.id) {
      const c = campaignById(params.id);
      return c ? `Campaign · ${c.name}` : "Campaign";
    }
    return LABELS[location.pathname] ?? "Dashboard";
  })();

  return (
    <header className="topbar">
      <div className="crumb">
        <span className="crumb-mute">postinghub</span>
        <I.Chevron size={11} />
        <span>{breadcrumb}</span>
      </div>

      <div className="top-actions">
        {kbdHint && <span className="kbd-hint">{kbdHint}</span>}
        <button className="btn-ghost" onClick={onCmdK}>
          <I.Search size={12} />
          <span>Search…</span>
          <span className="kbd">⌘K</span>
        </button>
        <button className="btn-ghost" title="Refresh">
          <I.Refresh size={13} />
        </button>
        <div className="top-divider" />
        <button className="btn-primary" onClick={() => nav("/dashboard/import")}>
          <I.Plus size={12} />
          <span>Import</span>
        </button>
      </div>
    </header>
  );
}
