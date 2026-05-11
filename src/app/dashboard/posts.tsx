import { useMemo } from "react";

import { FiltersBar } from "@/features/posts/FiltersBar";
import { PostsList } from "@/features/posts/PostsList";
import { PreviewPanel } from "@/features/posts/PreviewPanel";
import { usePosts } from "@/features/posts/usePosts";
import { PostsListSkeleton } from "@/components/ui/Skeleton";
import type { PostStatus } from "@/types/post";
import { usePostsShell } from "./posts-shell";

export default function PostsPage() {
  const {
    posts,
    filtered,
    filter,
    setFilter,
    focusId,
    setFocusId,
    selection,
    setSelection,
    toggleSelect,
    doCopy,
    copyText,
    setStatus,
    setPosts,
    searchInputRef,
    campaigns,
  } = usePostsShell();

  const focused =
    posts.find((p) => p.id === focusId) ?? filtered[0] ?? null;
  const focusedCampaign = focused
    ? campaigns.find((c) => c.id === focused.campaignId)
    : undefined;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [posts]);

  const resetFilter = () =>
    setFilter({
      status: "all",
      platform: "all",
      q: "",
      campaign: "all",
      kind: "all",
      quick: null,
    });

  const onBulkPublish = () => {
    setPosts((prev) =>
      prev.map((p) =>
        selection.has(p.id) ? { ...p, status: "published" as PostStatus } : p,
      ),
    );
    setSelection(new Set());
  };
  const onBulkArchive = () => {
    setPosts((prev) =>
      prev.map((p) =>
        selection.has(p.id) ? { ...p, status: "archived" as PostStatus } : p,
      ),
    );
    setSelection(new Set());
  };

  const { isLoading } = usePosts();
  const showSkeleton = isLoading && posts.length === 0;

  return (
    <div className="posts layout-split">
      <div className="posts-l">
        <FiltersBar
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          total={posts.length}
          selectedCount={selection.size}
          onBulkPublish={onBulkPublish}
          onBulkArchive={onBulkArchive}
          campaigns={campaigns}
          searchInputRef={searchInputRef}
        />
        {showSkeleton ? (
          <PostsListSkeleton />
        ) : (
          <PostsList
            posts={filtered}
            campaigns={campaigns}
            focusId={focusId}
            selection={selection}
            density="compact"
            copyMode="panel"
            onFocus={setFocusId}
            onToggleSelect={toggleSelect}
            onSelectAll={() => setSelection(new Set(filtered.map((p) => p.id)))}
            onClearAll={() => setSelection(new Set())}
            onCopy={(p) => doCopy(p)}
            onResetFilter={resetFilter}
          />
        )}
      </div>
      <div className="posts-r">
        <PreviewPanel
          post={focused}
          campaign={focusedCampaign}
          onClose={() => setFocusId(null)}
          onCopy={(p) => doCopy(p)}
          onCopyText={copyText}
          onChangeStatus={setStatus}
        />
      </div>
    </div>
  );
}
