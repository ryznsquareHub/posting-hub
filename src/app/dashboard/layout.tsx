import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { HelpOverlay } from "@/components/layout/HelpOverlay";
import { CmdPalette } from "@/components/layout/CmdPalette";
import { CAMPAIGNS, POSTS_SEED } from "@/data/seed";
// CAMPAIGNS / POSTS_SEED 는 초기 mount 시 fallback. cloud 데이터 도착 시 자동 대체.
import { isTypingInInput } from "@/lib/keyboard/scopes";
import { matchesScoped } from "@/lib/keyboard/matchesScoped";
import { STATUS_BY_HOTKEY, statusMeta } from "@/features/posts/status-meta";
import { useCampaigns } from "@/features/campaigns/useCampaigns";
import { usePosts, useUpdatePostStatus, useCopyPost } from "@/features/posts/usePosts";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useRealtime } from "@/lib/supabase/useRealtime";
import type { Post, PostStatus } from "@/types/post";
import type { Campaign } from "@/types/campaign";

import {
  PostsShellContext,
  type PostsShellState,
  type PostsFilter,
  type QuickFilter,
} from "./posts-shell";

// ── HTML rich copy helpers ───────────────────────────────────────────────
// 본문 안의 [사진N — img: URL] 라인을 <p><img src="URL"></p> 로 치환해
// 네이버/노션/워드 같은 rich-text 에디터에 paste 시 이미지가 자동 임베드되도록.
const COPY_IMG_LINE_RE = /^\s*\[사진\d+\s*[—\-]\s*img:\s*(https?:\/\/[^\]\s]+)\s*\]\s*$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function bodyToRichHtml(body: string): string {
  const lines = body.split("\n");
  const html: string[] = [];
  let para: string[] = [];
  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join("<br>").trim();
    if (joined) html.push(`<p>${joined}</p>`);
    para = [];
  };
  for (const line of lines) {
    const m = COPY_IMG_LINE_RE.exec(line);
    if (m) {
      flushPara();
      html.push(`<p><img src="${m[1]}" alt=""/></p>`);
    } else if (line.trim() === "") {
      flushPara();
    } else {
      para.push(escapeHtml(line));
    }
  }
  flushPara();
  return html.join("\n");
}

async function copyRich(body: string): Promise<void> {
  const html = bodyToRichHtml(body);
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([body], { type: "text/plain" }),
        }),
      ]);
      return;
    }
  } catch {
    /* fall through to plain text */
  }
  try {
    await navigator.clipboard?.writeText(body);
  } catch {
    /* clipboard unavailable */
  }
}

export default function DashboardLayout() {
  const location = useLocation();
  const nav = useNavigate();
  const params = useParams<{ id?: string }>();

  // ── Cloud data hooks (mock fallback if !isSupabaseConfigured) ───────────
  const { data: cloudCampaigns } = useCampaigns();
  const { data: cloudPosts } = usePosts();
  const updateStatusMut = useUpdatePostStatus();
  const copyMut = useCopyPost();
  useRealtime();

  // ── State (lifted; cloud 데이터 도착 시 자동 동기화) ──────────────────
  const [posts, setPosts] = useState<Post[]>(POSTS_SEED);
  const [campaigns, setCampaigns] = useState<Campaign[]>(CAMPAIGNS);
  const [focusId, setFocusId] = useState<string | null>(POSTS_SEED[0]?.id ?? null);
  const [selection, setSelection] = useState<Set<string>>(new Set());

  // cloud data → state 동기화 (cloud 모드에서만 실 변경, mock 모드는 동일 array)
  useEffect(() => {
    if (cloudCampaigns && cloudCampaigns.length > 0) setCampaigns(cloudCampaigns);
  }, [cloudCampaigns]);
  useEffect(() => {
    if (cloudPosts && cloudPosts.length > 0) {
      setPosts(cloudPosts);
      // focusId 가 cloudPosts 에 없으면 첫번째로
      if (!cloudPosts.find((p) => p.id === focusId)) {
        setFocusId(cloudPosts[0]?.id ?? null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudPosts]);
  const [filter, setFilter] = useState<PostsFilter>({
    status: "all",
    platform: "all",
    q: "",
    campaign: "all",
    kind: "all",
    quick: null,
  });
  const [burst, setBurst] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [sessionCopies, setSessionCopies] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 라우트가 campaign 으로 들어오면 filter.campaign 자동 주입
  useEffect(() => {
    if (
      location.pathname.startsWith("/dashboard/campaign/") &&
      params.id &&
      filter.campaign !== params.id
    ) {
      setFilter((f) => ({ ...f, campaign: params.id ?? "all" }));
    } else if (
      !location.pathname.startsWith("/dashboard/campaign/") &&
      filter.campaign !== "all" &&
      location.pathname === "/dashboard/posts"
    ) {
      // /dashboard/posts 직접 진입 시엔 campaign 필터 초기화
      // (단, 사이드바에서 다른 캠페인을 누른 경우는 별도 로직)
    }
  }, [location.pathname, params.id, filter.campaign]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => filterPosts(posts, filter),
    [posts, filter],
  );

  const focused = useMemo(
    () => posts.find((p) => p.id === focusId) ?? filtered[0] ?? null,
    [posts, focusId, filtered],
  );

  const queueCounts = useMemo(
    () => ({
      today: posts.filter((p) => isTodayPost(p)).length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      ready: posts.filter((p) => p.status === "ready" || p.status === "draft").length,
      recent: posts.filter((p) => p.copyCount > 0).length,
      recyclable: posts.filter((p) => p.recyclable).length,
    }),
    [posts],
  );

  // ── Mutators ────────────────────────────────────────────────────────────
  const doCopy = useCallback(
    (post: Post, opts?: { advance?: boolean }) => {
      // HTML rich + plain text 둘 다 클립보드로 → 본문에 박힌 [사진N — img: URL] 라인이
      // rich-text 에디터(네이버/노션/워드 등)에 paste 시 자동으로 <img> 로 임베드됨.
      // plain text 만 받는 곳은 fallback 으로 텍스트가 그대로 들어감.
      copyRich(post.body);
      setSessionCopies((n) => n + 1);
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id) return p;
          const newStatus: PostStatus =
            p.status === "ready" || p.status === "draft" ? "published" : p.status;
          return {
            ...p,
            copyCount: p.copyCount + 1,
            status: newStatus,
            _justCopied: Date.now(),
          };
        }),
      );
      window.setTimeout(() => {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, _justCopied: null } : p)),
        );
      }, 1400);
      // background: cloud 모드일 때만 실 DB 반영
      if (isSupabaseConfigured) {
        copyMut.mutate(post.id);
      }
      const imgCount = (post.body.match(/\[사진\d+\s*[—\-]\s*img:/g) || []).length;
      toast.success(
        imgCount > 0
          ? `본문 + 이미지 ${imgCount}장 복사됨 · ${post.platform === "NAVER_CAFE" ? "Cafe" : "Blog"}에 붙여넣기`
          : `본문 복사됨 · ${post.platform === "NAVER_CAFE" ? "Cafe" : "Blog"}에 붙여넣기`,
      );
      if (opts?.advance && burst) {
        const idx = filtered.findIndex((p) => p.id === post.id);
        const next =
          filtered.slice(idx + 1).find(
            (p) => p.status === "ready" || p.status === "draft",
          ) ?? filtered[idx + 1];
        if (next) {
          window.setTimeout(() => {
            setFocusId(next.id);
            document
              .querySelector(`[data-row-id="${next.id}"]`)
              ?.scrollIntoView({ block: "nearest" });
          }, 250);
        }
      }
    },
    [burst, filtered, copyMut],
  );

  const setStatus = useCallback(
    (id: string, status: PostStatus) => {
      setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      if (isSupabaseConfigured) {
        updateStatusMut.mutate({ id, status });
      }
      toast(`상태: '${statusMeta(status).label}'`);
    },
    [updateStatusMut],
  );

  const copyText = useCallback((text: string, msg: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast.success(msg);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onQuickFilter = useCallback(
    (key: string) => {
      const k = key as QuickFilter;
      setFilter((f) => ({
        ...f,
        quick: f.quick === k ? null : k,
        campaign: "all",
      }));
      nav("/dashboard/posts");
    },
    [nav],
  );

  // ── Keyboard ────────────────────────────────────────────────────────────
  const gMode = useRef(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = isTypingInInput(e.target);

      // ⌘K palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
        return;
      }

      if (!inInput && focused) {
        if (e.altKey && e.key.toLowerCase() === "c") {
          e.preventDefault();
          copyText(focused.cta ?? "", "CTA 복사됨");
          return;
        }
        if (e.shiftKey && e.key.toLowerCase() === "c") {
          e.preventDefault();
          copyText(focused.title, "제목 복사됨");
          return;
        }
      }

      if (inInput) return;

      if (e.key === "?" || e.key === "F1") {
        e.preventDefault();
        setHelpOpen((h) => !h);
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (cmdOpen) setCmdOpen(false);
        else if (helpOpen) setHelpOpen(false);
        else if (selection.size) setSelection(new Set());
        else setFocusId(null);
        return;
      }
      if (e.key === "b") {
        e.preventDefault();
        setBurst((b) => {
          toast(b ? "Burst 꺼짐" : "Burst 켜짐 — C 로 연속 복사");
          return !b;
        });
        return;
      }

      // g + letter → 페이지 이동
      if (e.key === "g") {
        gMode.current = true;
        window.setTimeout(() => (gMode.current = false), 700);
        return;
      }
      if (gMode.current) {
        if (e.key === "p") nav("/dashboard/posts");
        if (e.key === "o") nav("/dashboard");
        if (e.key === "t") nav("/dashboard/templates");
        if (e.key === "i") nav("/dashboard/import");
        if (e.key === "l") nav("/dashboard/prompt-library");
        gMode.current = false;
        return;
      }

      // /dashboard/posts 또는 campaign 경로일 때만 row 단축키 활성
      const isPostsContext =
        location.pathname === "/dashboard/posts" ||
        location.pathname.startsWith("/dashboard/campaign/");
      if (!isPostsContext) return;

      const idx = filtered.findIndex((p) => p.id === focusId);

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const ni = Math.min(filtered.length - 1, Math.max(0, idx + 1));
        if (filtered[ni]) {
          setFocusId(filtered[ni].id);
          requestAnimationFrame(() => {
            document
              .querySelector(`[data-row-id="${filtered[ni].id}"]`)
              ?.scrollIntoView({ block: "nearest" });
          });
        }
        return;
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const ni = Math.max(0, idx - 1);
        if (filtered[ni]) {
          setFocusId(filtered[ni].id);
          requestAnimationFrame(() => {
            document
              .querySelector(`[data-row-id="${filtered[ni].id}"]`)
              ?.scrollIntoView({ block: "nearest" });
          });
        }
        return;
      }
      if (e.key === "c" && focused) {
        e.preventDefault();
        doCopy(focused, { advance: true });
        return;
      }
      if (e.key === "n") {
        e.preventDefault();
        const start = filtered.findIndex((p) => p.id === focusId);
        const next = filtered
          .slice(start + 1)
          .find((p) => p.status === "ready" || p.status === "draft");
        if (next) {
          setFocusId(next.id);
          requestAnimationFrame(() => {
            document
              .querySelector(`[data-row-id="${next.id}"]`)
              ?.scrollIntoView({ block: "nearest" });
          });
        }
        return;
      }
      // Shift+1~9 = row #N 제목 복사, Alt+1~9 = row #N 본문 복사 (+ status 자동 전이)
      const digitMatch = e.code.match(/^Digit([1-9])$/);
      if (digitMatch) {
        const n = parseInt(digitMatch[1], 10);
        const target = filtered[n - 1];
        if (e.shiftKey && !e.metaKey && !e.ctrlKey && target) {
          e.preventDefault();
          copyText(target.title, `#${n} 제목 복사됨`);
          return;
        }
        if (e.altKey && target) {
          e.preventDefault();
          setFocusId(target.id);
          requestAnimationFrame(() => {
            document
              .querySelector(`[data-row-id="${target.id}"]`)
              ?.scrollIntoView({ block: "nearest" });
          });
          doCopy(target);
          return;
        }
        // modifier 없으면 기존 1~5 status hotkey
        if (!e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && focused && n <= 5) {
          e.preventDefault();
          const s = STATUS_BY_HOTKEY[String(n)];
          if (s) setStatus(focused.id, s);
          return;
        }
      }
      if (e.key === "d" && focused) {
        e.preventDefault();
        const dup: Post = {
          ...focused,
          id: "p_" + Math.random().toString(36).slice(2, 7),
          title: focused.title + " (복제)",
          copyCount: 0,
          status: "draft",
          _justCopied: null,
        };
        setPosts((prev) => {
          const i = prev.findIndex((p) => p.id === focused.id);
          const arr = [...prev];
          arr.splice(i + 1, 0, dup);
          return arr;
        });
        toast("복제됨");
        return;
      }
      if (e.key === "p" && focused) {
        e.preventDefault();
        setStatus(focused.id, "published");
        return;
      }
      if (e.key === "s" && focused) {
        e.preventDefault();
        setStatus(focused.id, "scheduled");
        return;
      }
      if (e.key === "x" && focused) {
        e.preventDefault();
        toggleSelect(focused.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    focused,
    filtered,
    focusId,
    selection,
    helpOpen,
    cmdOpen,
    location.pathname,
    doCopy,
    setStatus,
    nav,
    toggleSelect,
    copyText,
  ]);

  // ── Context value ───────────────────────────────────────────────────────
  const shellState: PostsShellState = {
    posts,
    setPosts,
    filtered,
    filter,
    setFilter,
    focusId,
    setFocusId,
    selection,
    setSelection,
    toggleSelect,
    burst,
    setBurst,
    sessionCopies,
    doCopy,
    copyText,
    setStatus,
    searchInputRef,
    campaigns,
  };

  const showStatusBar =
    location.pathname === "/dashboard/posts" ||
    location.pathname.startsWith("/dashboard/campaign/");

  return (
    <PostsShellContext.Provider value={shellState}>
      <div className={"app nav-sidebar den-compact" + (burst ? " burst-on" : "")}>
        <Sidebar
          campaigns={campaigns}
          posts={posts}
          queueCounts={queueCounts}
          activeQuickFilter={filter.quick}
          onQuickFilter={onQuickFilter}
        />
        <div className="main">
          <Topbar
            kbdHint={
              showStatusBar
                ? "J/K · C 복사 · 1-5 상태 · B Burst · ? 도움말"
                : null
            }
            onCmdK={() => setCmdOpen(true)}
          />
          <div className="main-body">
            <Outlet />
          </div>
          {showStatusBar && (
            <StatusBar
              filtered={filtered.length}
              total={posts.length}
              selection={selection.size}
              focusedTitle={focused?.title}
              burst={burst}
              sessionCopies={sessionCopies}
              onBurstToggle={() => setBurst((b) => !b)}
              onHelp={() => setHelpOpen(true)}
            />
          )}
        </div>
        <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
        <CmdPalette
          open={cmdOpen}
          onClose={() => setCmdOpen(false)}
          campaigns={campaigns}
        />
      </div>
    </PostsShellContext.Provider>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function isTodayPost(p: Post): boolean {
  const d = new Date().toISOString().slice(0, 10);
  return (
    p.scheduledAt?.startsWith(d) ||
    (p.status === "ready" && p.createdAt.startsWith(d))
  );
}

function filterPosts(posts: Post[], filter: PostsFilter): Post[] {
  return posts.filter((p) => {
    if (filter.status !== "all" && p.status !== filter.status) return false;
    if (filter.platform !== "all" && p.platform !== filter.platform) return false;
    if (filter.campaign !== "all" && p.campaignId !== filter.campaign) return false;
    if (filter.kind !== "all" && p.kind !== filter.kind) return false;
    if (filter.quick) {
      if (filter.quick === "today" && !isTodayPost(p)) return false;
      if (filter.quick === "scheduled" && p.status !== "scheduled") return false;
      if (
        filter.quick === "ready" &&
        !(p.status === "ready" || p.status === "draft")
      )
        return false;
      if (filter.quick === "recent" && p.copyCount === 0) return false;
      if (filter.quick === "recyclable" && !p.recyclable) return false;
    }
    if (filter.q && !matchesScoped(p, filter.q)) return false;
    return true;
  });
}
