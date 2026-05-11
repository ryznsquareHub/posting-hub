/**
 * D-009: mutation 의 owner_id 결정자.
 * 우선순위:
 *   1. session 의 user.id (자동 sign-in 성공 시)
 *   2. VITE_PUBLIC_OWNER_ID env (single-user fallback)
 *   3. 없으면 null — UI 가 "로그인 필요" 안내
 */
export function resolveOwnerId(sessionUserId: string | undefined | null): string | null {
  if (sessionUserId) return sessionUserId;
  const fb = import.meta.env.VITE_PUBLIC_OWNER_ID;
  return fb && fb.length > 0 ? fb : null;
}
