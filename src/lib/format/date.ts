/**
 * 운영툴 톤 시간 단축 포맷: "11/5 14:30"
 * D-001 시각 표현 통일.
 */
export function formatShortDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const H = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${M}/${D} ${H}:${m}`;
}

export function formatRelative(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < 60_000) return "방금";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  return formatShortDateTime(iso);
}
