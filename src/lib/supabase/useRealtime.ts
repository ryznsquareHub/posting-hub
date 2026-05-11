/**
 * Supabase Realtime — 다른 디바이스 / Edge Function (Hook callback) 으로
 * DB 가 변경되면 React Query cache 를 자동 invalidate.
 *
 * 구독 대상: posts, campaigns, intake_events, hooks
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "./client";

const TABLES = ["posts", "campaigns", "intake_events", "hooks", "prompts", "imports", "templates"] as const;

const KEY_MAP: Record<string, string[]> = {
  posts: ["posts"],
  campaigns: ["campaigns", "campaign"],
  intake_events: ["intake"],
  hooks: ["hooks"],
  prompts: ["prompts"],
  imports: ["imports"],
  templates: ["templates"],
};

export function useRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const sb = supabase();
    const channel = sb.channel("posting-hub-realtime");

    type OnFn = (
      event: string,
      opts: { event: string; schema: string; table: string },
      cb: () => void,
    ) => unknown;

    for (const table of TABLES) {
      (channel.on as unknown as OnFn)(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          for (const k of KEY_MAP[table] ?? []) {
            qc.invalidateQueries({ queryKey: [k] });
          }
        },
      );
    }

    channel.subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [qc]);
}
