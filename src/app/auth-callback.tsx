import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Icon } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Supabase OTP / OAuth redirect 처리.
 * Supabase JS 가 URL 에서 자동으로 토큰을 잡아 세션을 만든다 (detectSessionInUrl).
 * 이후 onAuthStateChange 가 발화 → user 가 채워지면 dashboard 로 이동.
 */
export default function AuthCallbackPage() {
  const { user, loading, configured } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!configured) {
      nav("/dashboard", { replace: true });
      return;
    }
    if (!loading && user) {
      nav("/dashboard", { replace: true });
    }
  }, [user, loading, configured, nav]);

  return (
    <div className="h-dvh grid place-items-center bg-bg">
      <div className="flex items-center gap-2 text-text-mid text-sm">
        <Icon.Loader size={14} className="animate-spin" />
        로그인 처리 중...
      </div>
    </div>
  );
}
