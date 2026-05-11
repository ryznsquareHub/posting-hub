/**
 * D-009: mutation 의 owner_id 결정자.
 * 우선순위:
 *   1. session 의 user.id (자동 sign-in 성공 시)
 *   2. VITE_PUBLIC_OWNER_ID env (single-user fallback)
 *   3. 없으면 null — UI 가 "로그인 필요" 안내
 */
function clean(v: string | undefined | null): string {
  if (!v) return "";
  let s = String(v).trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function resolveOwnerId(sessionUserId: string | undefined | null): string | null {
  const sid = clean(sessionUserId);
  if (sid) return sid;
  const fb = clean(import.meta.env.VITE_PUBLIC_OWNER_ID);
  return fb || null;
}
