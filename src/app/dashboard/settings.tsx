import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { I } from "@/components/icons";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LiveDot, timeAgo } from "@/lib/format/meta";
import { useAutomation } from "@/features/intake/useAutomation";

export default function SettingsPage() {
  const { user, configured, signOut } = useAuth();
  const nav = useNavigate();
  const [pending, setPending] = useState(false);
  const auto = useAutomation();

  const onSignOut = async () => {
    setPending(true);
    await signOut();
    setPending(false);
    if (configured) {
      nav("/login", { replace: true });
      toast("로그아웃 완료");
    }
  };

  return (
    <div className="today-page" style={{ maxWidth: 880 }}>
      <div className="t-head">
        <div>
          <h1>Settings</h1>
          <div className="t-sub">워크스페이스 · 멤버 · 통합 설정</div>
        </div>
      </div>

      {/* Account */}
      <section className="cd-prompt" style={{ padding: 16 }}>
        <div className="cd-prompt-h">
          <div>
            <div className="cd-prompt-eyebrow">ACCOUNT</div>
            <h2>계정</h2>
            <div className="cd-prompt-sub">
              {configured
                ? "Supabase 에 연결되어 있습니다."
                : "Mock 모드 — Doppler / Supabase 설정 후 실제 로그인 가능."}
            </div>
          </div>
          {configured && (
            <button
              className="btn-ghost xs"
              onClick={onSignOut}
              disabled={pending}
            >
              <I.Power size={11} /> 로그아웃
            </button>
          )}
        </div>
        <div className="cd-stats" style={{ marginTop: 12 }}>
          <div className="cd-stat">
            <div className="cd-stat-l">이메일</div>
            <div className="cd-stat-v" style={{ fontSize: 14, fontFamily: "var(--mono)" }}>
              {user?.email ?? "—"}
            </div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-l">상태</div>
            <div className="cd-stat-v" style={{ fontSize: 14 }}>
              <LiveDot status={configured ? "live" : "off"} />{" "}
              {configured ? "Supabase 연결됨" : "Mock 모드"}
            </div>
          </div>
        </div>
      </section>

      {/* Hook status */}
      <section className="cd-prompt" style={{ padding: 16, marginTop: 16 }}>
        <div className="cd-prompt-h">
          <div>
            <div className="cd-prompt-eyebrow">HOOK</div>
            <h2>Webhook 엔드포인트</h2>
            <div className="cd-prompt-sub">
              Claude → PostingHub 콜백. 자세한 운영은{" "}
              <button
                className="t-jump"
                onClick={() => nav("/dashboard/import")}
              >
                Intake
              </button>
              .
            </div>
          </div>
          <div
            className={"cd-hook " + (auto.hookLive ? "on" : "off")}
            title="Webhook 상태"
          >
            <LiveDot status={auto.hookLive ? "live" : "off"} />
            <span className="cd-hook-l">
              {auto.hookLive ? "Webhook Ready" : "Webhook Off"}
            </span>
            <span className="cd-hook-sep">·</span>
            <span className="mono">{auto.hookCount}</span>
            <span className="mute">hooks</span>
          </div>
        </div>
        <div className="cd-stats" style={{ marginTop: 12 }}>
          <div className="cd-stat">
            <div className="cd-stat-v">{auto.intake24h}</div>
            <div className="cd-stat-l">24h 수집</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-v">{auto.queuedToday}</div>
            <div className="cd-stat-l">Queue 등록</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-v">{auto.errorsToday}</div>
            <div className="cd-stat-l">에러</div>
          </div>
          <div className="cd-stat">
            <div className="cd-stat-v" style={{ fontSize: 14 }}>
              {timeAgo(auto.lastHookAt)}
            </div>
            <div className="cd-stat-l">마지막 수신</div>
          </div>
        </div>
      </section>

      {/* Env / Doppler */}
      <section className="cd-prompt" style={{ padding: 16, marginTop: 16 }}>
        <div className="cd-prompt-h">
          <div>
            <div className="cd-prompt-eyebrow">SECRETS</div>
            <h2>환경변수 · Doppler</h2>
            <div className="cd-prompt-sub">
              모든 시크릿은 Doppler{" "}
              <code className="mono">postinghub</code> 프로젝트 (
              <code className="mono">dev</code> /{" "}
              <code className="mono">stg</code> /{" "}
              <code className="mono">prd</code>) 에서 관리. 로컬:{" "}
              <code className="mono">doppler run -- npm run dev</code>.
              자세한 setup 은 <code className="mono">docs/OPS.md</code>.
            </div>
          </div>
        </div>
        <div className="wf-hook-grid" style={{ marginTop: 12 }}>
          <div className="wf-hook-cell">
            <div className="wf-hook-l">VITE_PUBLIC_SUPABASE_URL</div>
            <div className="mono mute">클라이언트 + 서버</div>
          </div>
          <div className="wf-hook-cell">
            <div className="wf-hook-l">VITE_PUBLIC_SUPABASE_ANON_KEY</div>
            <div className="mono mute">클라이언트 + 서버 (RLS)</div>
          </div>
          <div className="wf-hook-cell">
            <div className="wf-hook-l">SUPABASE_SERVICE_ROLE_KEY</div>
            <div className="mono mute">Edge Function 전용</div>
          </div>
          <div className="wf-hook-cell">
            <div className="wf-hook-l">HOOK_SHARED_SECRET</div>
            <div className="mono mute">Edge Function 전용</div>
          </div>
        </div>
      </section>
    </div>
  );
}
