/**
 * Posts shell context — DashboardLayout 이 lift up 한 상태를
 * 하위 라우트 (posts / campaign-detail / today / intake) 가 공유.
 *
 * 디자인 패키지 app.jsx 의 App() 안 state 와 동일 구조.
 */

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

import type { Campaign } from "@/types/campaign";
import type { Post, PostStatus } from "@/types/post";

export type QuickFilter =
  | "today"
  | "scheduled"
  | "ready"
  | "recent"
  | "recyclable";

export interface PostsFilter {
  status: PostStatus | "all";
  platform: "all" | "NAVER_BLOG" | "NAVER_CAFE";
  q: string;
  campaign: string;
  kind: "all" | "original" | "variant" | "recycled";
  quick: QuickFilter | null;
}

export interface PostsShellState {
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  filtered: Post[];
  filter: PostsFilter;
  setFilter: Dispatch<SetStateAction<PostsFilter>>;
  focusId: string | null;
  setFocusId: Dispatch<SetStateAction<string | null>>;
  selection: Set<string>;
  setSelection: Dispatch<SetStateAction<Set<string>>>;
  toggleSelect: (id: string) => void;
  burst: boolean;
  setBurst: Dispatch<SetStateAction<boolean>>;
  sessionCopies: number;
  doCopy: (post: Post, opts?: { advance?: boolean }) => void;
  copyText: (text: string, msg: string) => void;
  setStatus: (id: string, status: PostStatus) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  campaigns: Campaign[];
}

export const PostsShellContext = createContext<PostsShellState | null>(null);

export function usePostsShell(): PostsShellState {
  const v = useContext(PostsShellContext);
  if (!v) {
    throw new Error(
      "usePostsShell must be used inside DashboardLayout (PostsShellContext)",
    );
  }
  return v;
}
