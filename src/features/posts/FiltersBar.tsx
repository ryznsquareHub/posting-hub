import { I } from "@/components/icons";
import { STATUSES, KINDS } from "@/data/seed";
import type { PostsFilter } from "@/app/dashboard/posts-shell";
import type { Campaign } from "@/types/campaign";

interface FiltersBarProps {
  filter: PostsFilter;
  setFilter: React.Dispatch<React.SetStateAction<PostsFilter>>;
  counts: Record<string, number>;
  total: number;
  selectedCount: number;
  onBulkPublish: () => void;
  onBulkArchive: () => void;
  campaigns: Campaign[];
  hideCampaign?: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
}

const QUICK_LABELS: Record<string, string> = {
  today: "오늘",
  scheduled: "예약",
  ready: "발행대기",
  recent: "최근 복사",
  recyclable: "재활용",
};

export function FiltersBar({
  filter,
  setFilter,
  counts,
  total,
  selectedCount,
  onBulkPublish,
  onBulkArchive,
  campaigns,
  hideCampaign,
  searchInputRef,
}: FiltersBarProps) {
  return (
    <div className="filters">
      <div className="filter-tabs">
        <button
          className={"f-tab " + (filter.status === "all" ? "on" : "")}
          onClick={() => setFilter({ ...filter, status: "all" })}
        >
          All <span className="f-count">{total}</span>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.key}
            className={"f-tab " + (filter.status === s.key ? "on" : "")}
            onClick={() => setFilter({ ...filter, status: s.key })}
          >
            <span className="pill-dot" style={{ background: s.dot }} />
            {s.label} <span className="f-count">{counts[s.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="filter-right">
        {filter.quick && (
          <button
            className="quick-chip"
            onClick={() => setFilter({ ...filter, quick: null })}
          >
            <span className="pill-dot" style={{ background: "#a385ff" }} />
            {QUICK_LABELS[filter.quick] ?? filter.quick}
            <I.X size={9} />
          </button>
        )}
        {!hideCampaign && (
          <select
            className="sel-tiny"
            value={filter.campaign}
            onChange={(e) => setFilter({ ...filter, campaign: e.target.value })}
          >
            <option value="all">모든 캠페인</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        <select
          className="sel-tiny"
          value={filter.kind}
          onChange={(e) =>
            setFilter({ ...filter, kind: e.target.value as PostsFilter["kind"] })
          }
        >
          <option value="all">종류 전체</option>
          {KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <div className="seg-tiny">
          {(
            [
              { k: "all",        l: "전체" },
              { k: "NAVER_BLOG", l: "Blog" },
              { k: "NAVER_CAFE", l: "Cafe" },
            ] as const
          ).map((o) => (
            <button
              key={o.k}
              className={filter.platform === o.k ? "on" : ""}
              onClick={() => setFilter({ ...filter, platform: o.k })}
            >
              {o.l}
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <I.Search size={11} />
          <input
            ref={searchInputRef}
            placeholder="검색 · platform:blog kw:할인 식 가능"
            value={filter.q}
            onChange={(e) => setFilter({ ...filter, q: e.target.value })}
          />
          <span className="kbd small">/</span>
        </div>
        {selectedCount > 0 ? (
          <div className="bulk-bar">
            <span className="bulk-count">{selectedCount} 선택</span>
            <button className="btn-ghost xs" onClick={onBulkPublish}>
              <I.Check size={11} /> 발행완료
            </button>
            <button className="btn-ghost xs" onClick={onBulkArchive}>
              <I.Archive size={11} /> 보관
            </button>
          </div>
        ) : (
          <button className="btn-ghost xs">
            <I.Filter size={11} /> 필터 <span className="kbd small">F</span>
          </button>
        )}
      </div>
    </div>
  );
}
