/**
 * 디자인 quickops.jsx 의 HelpOverlay 1:1 매핑.
 * className: help-overlay / help-card / help-head / help-title / help-close /
 *            help-grid / help-group / help-table / help-foot
 */

interface HelpOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface HelpGroup {
  title: string;
  rows: [string, string][];
}

const GROUPS: HelpGroup[] = [
  {
    title: "Navigation",
    rows: [
      ["J  ↓", "다음 행"],
      ["K  ↑", "이전 행"],
      ["N", "다음 발행대기"],
      ["G P", "Posts로 점프"],
      ["G O", "Today로 점프"],
      ["G I", "Intake로 점프"],
      ["G L", "Workflows로 점프"],
      ["G T", "Templates로 점프"],
      ["⌘K", "커맨드 팔레트"],
      ["/", "검색 포커스"],
    ],
  },
  {
    title: "Copy",
    rows: [
      ["C", "본문 복사 (+ 상태 자동 전이)"],
      ["⇧ C", "제목만 복사"],
      ["⌥ C", "CTA만 복사"],
      ["B", "Burst 모드 토글 (자동 다음 행)"],
    ],
  },
  {
    title: "Status & Edit",
    rows: [
      ["1 / 2 / 3 / 4 / 5", "Draft / Ready / Scheduled / Published / Archived"],
      ["P", "발행완료로 표시"],
      ["S", "예약발행으로 표시"],
      ["D", "현재 행 복제"],
      ["X", "선택 토글 (다중선택)"],
      ["Esc", "패널/모달/선택 해제"],
    ],
  },
  {
    title: "Search syntax",
    rows: [
      ["platform:blog", "Blog만 / cafe만"],
      ["status:ready", "상태 필터"],
      ["region:서울", "지역 필터"],
      ["kw:할인", "키워드 매칭"],
      ["industry:카페", "업종 필터"],
      ["memo:이미지", "메모 검색"],
    ],
  },
];

export function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  if (!open) return null;
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-card" onClick={(e) => e.stopPropagation()}>
        <div className="help-head">
          <div className="help-title">Keyboard & search</div>
          <button className="help-close" onClick={onClose}>
            Esc
          </button>
        </div>
        <div className="help-grid">
          {GROUPS.map((g) => (
            <div className="help-group" key={g.title}>
              <div className="help-group-title">{g.title}</div>
              <table className="help-table">
                <tbody>
                  {g.rows.map(([k, v]) => (
                    <tr key={k}>
                      <td>
                        <kbd>{k}</kbd>
                      </td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        <div className="help-foot">
          <span>운영툴 · 모든 동선은 키보드로 완결</span>
          <span className="mono">? to toggle</span>
        </div>
      </div>
    </div>
  );
}
