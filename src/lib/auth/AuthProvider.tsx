import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "../supabase/client";

interface AuthState {
  /** Supabase 미구성 시엔 mock user 로 동작 */
  user: User | { id: string; email: string } | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const MOCK_USER = { id: "mock-owner", email: "founder@local" } as const;

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(
    isSupabaseConfigured ? null : MOCK_USER,
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = supabase();
    let mounted = true;

    const autoEmail = import.meta.env.VITE_PUBLIC_AUTO_SIGNIN_EMAIL;
    const autoPass = import.meta.env.VITE_PUBLIC_AUTO_SIGNIN_PASSWORD;
    const autoEnabled = Boolean(autoEmail && autoPass);

    (async () => {
      const { data } = await sb.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
        return;
      }

      // D-008: single-user 자동 sign-in
      if (autoEnabled) {
        const { data: signIn, error } = await sb.auth.signInWithPassword({
          email: autoEmail!,
          password: autoPass!,
        });
        if (!mounted) return;
        if (error) {
          console.error("[AuthProvider] auto sign-in failed:", error.message);
          setLoading(false);
          return;
        }
        setSession(signIn.session);
        setUser(signIn.user);
        setLoading(false);
        return;
      }

      // 매직링크 흐름 (팀 모드 / 비번 미설정)
      setLoading(false);
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = useMemo(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      signInWithMagicLink: async (email: string) => {
        if (!isSupabaseConfigured) {
          return { error: "Supabase 가 구성되지 않았습니다 (.env.local 확인)" };
        }
        const { error } = await supabase().auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth-callback`,
          },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        if (!isSupabaseConfigured) return;
        await supabase().auth.signOut();
      },
    }),
    [user, session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(AuthContext);
  if (!v) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return v;
}
