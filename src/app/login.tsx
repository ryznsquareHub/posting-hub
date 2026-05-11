import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { Icon } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LoginPage() {
  const { user, configured, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const location = useLocation();
  const next = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (user) return <Navigate to={next} replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    const { error } = await signInWithMagicLink(email.trim());
    setPending(false);
    if (error) {
      toast.error(error);
      return;
    }
    setSent(true);
    toast.success("로그인 링크를 이메일로 보냈습니다");
  };

  return (
    <div className="h-dvh grid place-items-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div
            className="w-7 h-7 rounded-md grid place-items-center text-white"
            style={{
              background:
                "linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 65%, #000))",
              boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M5 4v16M5 4h7a4 4 0 0 1 0 8H5" />
            </svg>
          </div>
          <span className="text-text-hi font-semibold tracking-tight2">
            PostingHub
          </span>
        </div>

        <div className="rounded-lg border border-border-1 bg-bg-1 p-5">
          <h1 className="text-text-hi text-sm font-medium mb-1">로그인</h1>
          <p className="text-text-mid text-xs mb-4">
            이메일로 매직 링크를 받아 로그인합니다.
          </p>

          {!configured && (
            <div className="mb-3 px-3 py-2 rounded border border-status-ready/30 bg-status-ready/10 text-status-ready text-xs">
              ⚠️ Supabase 가 구성되지 않았습니다 — mock 모드로 로그인 없이 동작합니다.
              <div className="mt-1 font-mono text-xxs opacity-80">
                .env.local 또는 Doppler 설정 후 dev 재시작.
              </div>
            </div>
          )}

          {sent ? (
            <div className="px-3 py-4 rounded border border-status-published/30 bg-status-published/10 text-status-published text-sm">
              <div className="flex items-start gap-2">
                <Icon.Check size={14} className="mt-0.5" />
                <div>
                  <div className="font-medium">메일 발송 완료</div>
                  <div className="text-xs text-status-published/80 mt-1">
                    <code className="font-mono">{email}</code> 받은편지함에서 링크를 열어주세요.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xxs text-text-dim uppercase tracking-[0.06em]">
                  이메일
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pending || !configured}
                  className="h-9 px-3 rounded-md border border-border-1 bg-bg-2 text-text text-sm focus:border-border-3 outline-none disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="submit"
                disabled={pending || !configured || !email.trim()}
                className="btn-primary !h-9 !w-full !text-sm justify-center disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Icon.Loader size={13} className="animate-spin" />
                    전송 중...
                  </>
                ) : (
                  "매직 링크 받기"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-text-dim text-xxs text-center mt-3 font-mono">
          PostingHub · AI 콘텐츠 운영 OS
        </p>
      </div>
    </div>
  );
}
