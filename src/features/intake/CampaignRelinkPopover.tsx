import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { I } from "@/components/icons";
import type { Campaign } from "@/types/campaign";

import { useRelinkIntake } from "./useRelinkIntake";

interface Props {
  eventId: string;
  currentCampaignId: string | null;
  /** intake_events.campaign_matched (Hook 이 받은 원본 라벨) */
  currentLabel: string | null;
  campaigns: Campaign[];
}

export function CampaignRelinkPopover({
  eventId,
  currentCampaignId,
  currentLabel,
  campaigns,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const relink = useRelinkIntake();

  const current = campaigns.find((c) => c.id === currentCampaignId);
  const matched = !!currentCampaignId;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", handler);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  const filtered = q
    ? campaigns.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : campaigns;

  async function pick(c: Campaign | null) {
    setOpen(false);
    setQ("");
    try {
      const r = await relink.mutateAsync({ eventId, campaign: c, campaigns });
      if (!c) {
        toast("매칭 해제됨");
        return;
      }
      if (r.promoted) toast.success(`${c.name} 매칭 + 운영 큐(draft) 등록`);
      else if (r.alreadyExists) toast(`${c.name} 매칭 (이미 등록된 글)`);
      else if (r.reason === "parse_error") toast(`${c.name} 매칭 (파싱 실패라 승급 안 함)`);
      else if (r.reason === "raw_body_missing") toast(`${c.name} 매칭 (원본 본문 없음 — 수동 등록 필요)`);
      else toast.success(`${c.name} 매칭됨`);
    } catch (e) {
      toast.error((e as Error).message ?? "재매칭 실패");
    }
  }

  return (
    <div className="intake-relink" ref={rootRef}>
      <button
        type="button"
        className={"intake-relink-trigger" + (matched ? "" : " unmatched")}
        onClick={() => setOpen((o) => !o)}
        disabled={relink.isPending}
        title="클릭하여 캠페인 재지정"
      >
        {current && (
          <span className="cmp-color" style={{ background: current.color }} />
        )}
        <span className="intake-relink-label ellip">
          {currentLabel || "—"}
        </span>
        <I.ChevDown size={10} />
      </button>
      {open && (
        <div className="intake-relink-pop">
          <input
            autoFocus
            className="intake-relink-search"
            placeholder="캠페인 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="intake-relink-list">
            {matched && (
              <button
                type="button"
                className="intake-relink-row unlink"
                onClick={() => pick(null)}
              >
                <I.X size={11} />
                <span>매칭 해제</span>
              </button>
            )}
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                className={
                  "intake-relink-row" +
                  (c.id === currentCampaignId ? " current" : "")
                }
                onClick={() => pick(c)}
              >
                <span className="cmp-color" style={{ background: c.color }} />
                <span className="ellip">{c.name}</span>
                {c.id === currentCampaignId && (
                  <I.Check size={11} className="intake-relink-check" />
                )}
              </button>
            ))}
            {!filtered.length && (
              <div className="intake-relink-empty">캠페인 없음</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
