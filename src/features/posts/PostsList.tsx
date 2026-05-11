import { I } from "@/components/icons";
import { PostRow } from "./PostRow";
import type { Campaign } from "@/types/campaign";
import type { Post } from "@/types/post";

interface PostsListProps {
  posts: Post[];
  campaigns: Campaign[];
  focusId: string | null;
  selection: Set<string>;
  density: "compact" | "comfy";
  copyMode: "inline" | "panel" | "modal";
  onFocus: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onCopy: (p: Post) => void;
  onResetFilter: () => void;
}

export function PostsList({
  posts,
  campaigns,
  focusId,
  selection,
  density,
  copyMode,
  onFocus,
  onToggleSelect,
  onSelectAll,
  onClearAll,
  onCopy,
  onResetFilter,
}: PostsListProps) {
  const allSelected = selection.size > 0 && selection.size === posts.length;
  const someSelected = selection.size > 0 && !allSelected;

  return (
    <div className="rows">
      <div className="row-head">
        <div className="row-check">
          <span
            className={"chkbx " + (allSelected ? "on" : someSelected ? "some" : "")}
            onClick={() => (allSelected ? onClearAll() : onSelectAll())}
          >
            {allSelected && <I.Check size={10} strokeWidth={2.4} />}
            {someSelected && (
              <span
                style={{
                  width: 7,
                  height: 2,
                  background: "#9aa1ab",
                  borderRadius: 2,
                }}
              />
            )}
          </span>
        </div>
        <div className="row-status" />
        <div className="row-cmp">Campaign</div>
        <div className="row-title">제목 · 메타</div>
        <div className="row-kind">종류</div>
        <div className="row-status-text">상태</div>
        <div className="row-copies">복사</div>
        <div className="row-time">시간</div>
        <div className="row-actions" />
      </div>

      {posts.map((p) => (
        <PostRow
          key={p.id}
          post={p}
          campaign={campaigns.find((c) => c.id === p.campaignId)}
          focused={focusId === p.id}
          selected={selection.has(p.id)}
          density={density}
          copyMode={copyMode}
          onFocus={onFocus}
          onSelect={onToggleSelect}
          onCopy={onCopy}
        />
      ))}

      {posts.length === 0 && (
        <div className="rows-empty">
          <I.Search size={16} />
          <div>검색 결과 없음</div>
          <button className="link-btn" onClick={onResetFilter}>
            필터 초기화
          </button>
        </div>
      )}
    </div>
  );
}
