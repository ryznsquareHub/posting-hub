import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { I } from "@/components/icons";
import type { Campaign } from "@/types/campaign";

interface CmdPaletteProps {
  open: boolean;
  onClose: () => void;
  campaigns: Campaign[];
}

interface CmdItem {
  label: string;
  hint: string;
  run: () => void;
}

export function CmdPalette({ open, onClose, campaigns }: CmdPaletteProps) {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const baseItems: CmdItem[] = [
    { label: "Go to Today",       hint: "G O", run: () => { nav("/dashboard"); onClose(); } },
    { label: "Go to All posts",   hint: "G P", run: () => { nav("/dashboard/posts"); onClose(); } },
    { label: "Go to Intake",      hint: "G I", run: () => { nav("/dashboard/import"); onClose(); } },
    { label: "Go to Workflows",   hint: "G L", run: () => { nav("/dashboard/prompt-library"); onClose(); } },
    { label: "Go to Templates",   hint: "G T", run: () => { nav("/dashboard/templates"); onClose(); } },
    { label: "Go to History",     hint: "—",   run: () => { nav("/dashboard/history"); onClose(); } },
    { label: "Go to Settings",    hint: "—",   run: () => { nav("/dashboard/settings"); onClose(); } },
  ];

  const campaignItems: CmdItem[] = campaigns.map((c) => ({
    label: `Campaign · ${c.name}`,
    hint: c.region,
    run: () => {
      nav(`/dashboard/campaign/${c.id}`);
      onClose();
    },
  }));

  const items = [...baseItems, ...campaignItems].filter((i) =>
    i.label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input">
          <I.Search size={14} />
          <input
            autoFocus
            placeholder="명령 또는 캠페인 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && items[0]) {
                e.preventDefault();
                items[0].run();
              }
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list">
          {items.map((it, i) => (
            <button key={i} className="cmdk-item" onClick={it.run}>
              <span>{it.label}</span>
              <span className="kbd small">{it.hint}</span>
            </button>
          ))}
          {items.length === 0 && <div className="cmdk-empty">결과 없음</div>}
        </div>
      </div>
    </div>
  );
}
