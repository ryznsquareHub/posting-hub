import { Navigate, useLocation } from "react-router-dom";

import { Icon } from "@/components/icons";
import { useAuth } from "./AuthProvider";

/**
 * 보호 라우트 래퍼 — 미인증 시 /login 으로 (state.from 보존).
 * Supabase 미구성 시엔 mock user 가 항상 있으므로 통과.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-dvh grid place-items-center bg-bg">
        <div className="flex items-center gap-2 text-text-mid text-sm">
          <Icon.Loader size={14} className="animate-spin" />
          세션 확인 중...
        </div>
      </div>
    );
  }

  if (!user && configured) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
