import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase 가 구성되어 있는지 — 로컬 개발 시 mock seed fallback 토글에 사용.
 * Phase 2 에선 env 가 비어 있어도 앱이 동작해야 한다 (seed.ts 그대로).
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let _client: SupabaseClient<Database> | null = null;

export function supabase(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase 가 구성되지 않았습니다. VITE_PUBLIC_SUPABASE_URL / VITE_PUBLIC_SUPABASE_ANON_KEY 를 설정하세요. " +
        "Doppler 사용 시 `doppler run -- npm run dev` 또는 `npm run env:pull` 후 dev 재시작.",
    );
  }
  if (!_client) {
    _client = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return _client;
}
