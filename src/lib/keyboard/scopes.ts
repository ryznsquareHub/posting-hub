/**
 * 키보드 단축키 등록부 — 단일 source of truth.
 * HelpOverlay 가 이 배열을 그대로 렌더링한다.
 *
 * 새 단축키 추가 시:
 *   1. 이 파일에 메타 등록
 *   2. useGlobalShortcuts 또는 page-level handler 에서 동작 구현
 *   3. HelpOverlay 자동 반영
 */

export type Scope = "global" | "posts";

export interface ShortcutMeta {
  keys: string[]; // ex: ["J"], ["⌘","K"], ["G","P"]
  desc: string;
  scope: Scope;
  group: "navigation" | "copy" | "status" | "search" | "edit";
}

export const SHORTCUTS: ShortcutMeta[] = [
  // navigation
  { keys: ["J"],       desc: "다음 행",                 scope: "posts",  group: "navigation" },
  { keys: ["K"],       desc: "이전 행",                 scope: "posts",  group: "navigation" },
  { keys: ["N"],       desc: "다음 발행대기로 점프",     scope: "posts",  group: "navigation" },
  { keys: ["G","O"],   desc: "Today (overview)",        scope: "global", group: "navigation" },
  { keys: ["G","P"],   desc: "Posts",                   scope: "global", group: "navigation" },
  { keys: ["G","I"],   desc: "Intake (Inbox)",          scope: "global", group: "navigation" },
  { keys: ["G","L"],   desc: "Prompt Library",          scope: "global", group: "navigation" },
  { keys: ["G","T"],   desc: "Templates",               scope: "global", group: "navigation" },
  { keys: ["⌘","K"],   desc: "Command palette",         scope: "global", group: "navigation" },

  // copy
  { keys: ["C"],       desc: "본문 복사 (status 자동 전이)", scope: "posts", group: "copy" },
  { keys: ["⇧","C"],   desc: "제목만 복사",              scope: "posts",  group: "copy" },
  { keys: ["⌥","C"],   desc: "CTA 만 복사",              scope: "posts",  group: "copy" },
  { keys: ["B"],       desc: "Burst 모드 토글 (C 연속)", scope: "posts",  group: "copy" },

  // status (focused row)
  { keys: ["1"],       desc: "초안",                    scope: "posts",  group: "status" },
  { keys: ["2"],       desc: "발행대기",                scope: "posts",  group: "status" },
  { keys: ["3"],       desc: "예약",                    scope: "posts",  group: "status" },
  { keys: ["4"],       desc: "발행완료",                scope: "posts",  group: "status" },
  { keys: ["5"],       desc: "보관",                    scope: "posts",  group: "status" },

  // 위치 기반 빠른 복사 (테이블 맨 위에서 1~9 번째 row)
  { keys: ["⇧","1"],   desc: "#1 row 제목 복사 (⇧2~9 도 동일 패턴)", scope: "posts", group: "copy" },
  { keys: ["⌥","1"],   desc: "#1 row 본문 복사 + 발행완료 자동 (⌥2~9 도)", scope: "posts", group: "copy" },
  { keys: ["P"],       desc: "발행완료 (=4)",           scope: "posts",  group: "status" },
  { keys: ["S"],       desc: "예약 (=3)",               scope: "posts",  group: "status" },
  { keys: ["X"],       desc: "선택 토글",               scope: "posts",  group: "edit" },

  // search
  { keys: ["/"],       desc: "검색창 포커스",            scope: "global", group: "search" },
  { keys: ["?"],       desc: "도움말 토글",              scope: "global", group: "search" },
  { keys: ["Esc"],     desc: "모달/오버레이/선택 닫기",  scope: "global", group: "navigation" },

  // edit
  { keys: ["D"],       desc: "현재 행 복제",             scope: "posts",  group: "edit" },
];

export const SHORTCUT_GROUPS = [
  { id: "navigation", label: "이동" },
  { id: "copy",       label: "복사" },
  { id: "status",     label: "상태" },
  { id: "search",     label: "검색 / 도움" },
  { id: "edit",       label: "편집" },
] as const;

/** 입력 필드 안에서 단축키 비활성 — 모든 핸들러가 동일 검사 사용 */
export function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return true;
  if (target.isContentEditable) return true;
  return false;
}
