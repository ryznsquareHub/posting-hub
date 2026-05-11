import { I } from "@/components/icons";

interface StatusBarProps {
  filtered: number;
  total: number;
  selection: number;
  focusedTitle?: string;
  filterView?: string;
  query?: string;
  burst: boolean;
  sessionCopies: number;
  onBurstToggle: () => void;
  onHelp: () => void;
}

export function StatusBar({
  filtered,
  total,
  selection,
  focusedTitle,
  filterView,
  query,
  burst,
  sessionCopies,
  onBurstToggle,
  onHelp,
}: StatusBarProps) {
  return (
    <div className="statusbar">
      <div className="sb-left">
        <span className="sb-seg">
          <span className="sb-key">view</span>
          <span className="sb-val mono">{filterView ?? "posts"}</span>
        </span>
        {query && (
          <span className="sb-seg ellipsis">
            <span className="sb-key">q</span>
            <span className="sb-val mono">{query}</span>
          </span>
        )}
        <span className="sb-seg">
          <span className="sb-key">rows</span>
          <span className="sb-val mono">
            {filtered}
            <span className="sb-val" style={{ color: "var(--text-dim)" }}>
              {" "}/ {total}
            </span>
          </span>
        </span>
        {selection > 0 && (
          <span className="sb-seg sel">
            <span className="sb-key">sel</span>
            <span className="sb-val mono">{selection}</span>
          </span>
        )}
        {focusedTitle && (
          <span className="sb-seg ellipsis dim">
            <span className="sb-key">focus</span>
            <span className="sb-val">{focusedTitle}</span>
          </span>
        )}
      </div>
      <div className="sb-right">
        <button
          className={"sb-btn " + (burst ? "on" : "")}
          onClick={onBurstToggle}
          title="Burst 모드 (B)"
        >
          <span className="sb-dot" />
          burst {burst ? "ON" : "OFF"}
        </button>
        <span className="sb-seg">
          <span className="sb-key">copies</span>
          <span className="sb-val mono">{sessionCopies}</span>
        </span>
        <button className="sb-btn" onClick={onHelp} title="도움말 (?)">
          <I.Help size={11} /> ? help
        </button>
      </div>
    </div>
  );
}
