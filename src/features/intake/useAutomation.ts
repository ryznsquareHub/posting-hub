import { useMemo } from "react";

import { useHookEndpoints, useIntakeFeed } from "./useIntake";
import { usePrompts } from "@/features/prompts/usePrompts";
import { AUTOMATION as SEED_AUTOMATION } from "@/data/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export interface AutomationStats {
  hookLive: boolean;
  hookCount: number;
  autoParseOn: number;
  manualOnly: number;
  intake24h: number;
  queuedToday: number;
  errorsToday: number;
  lastHookAt: string | null;
}

/**
 * Hook / Prompt / IntakeEvent 데이터로부터 운영 통계 derive.
 * Sidebar / Today / Intake / Settings 에서 동일하게 사용.
 *
 * Mock 모드 fallback: seed.ts 의 AUTOMATION 상수.
 */
export function useAutomation(): AutomationStats {
  const { data: hooks } = useHookEndpoints();
  const { data: prompts } = usePrompts();
  const { data: feed } = useIntakeFeed(200);

  return useMemo<AutomationStats>(() => {
    if (!isSupabaseConfigured) return SEED_AUTOMATION;

    const hk = hooks ?? [];
    const pr = prompts ?? [];
    const fd = feed ?? [];

    const today = new Date().toISOString().slice(0, 10);
    const dayAgo = Date.now() - 24 * 3600_000;

    const intake24h = fd.filter((e) => new Date(e.at).getTime() >= dayAgo).length;
    const queuedToday = fd.filter(
      (e) => e.at.startsWith(today) && e.queued,
    ).length;
    const errorsToday = fd.filter(
      (e) => e.at.startsWith(today) && e.parseStatus === "error",
    ).length;
    const lastHook = fd.find((e) => e.source === "hook");

    return {
      hookLive: hk.some((h) => h.status === "live"),
      hookCount: hk.filter((h) => h.status !== "off").length,
      autoParseOn: pr.filter((p) => p.autoParse).length,
      manualOnly: pr.filter((p) => !p.webhookEnabled).length,
      intake24h,
      queuedToday,
      errorsToday,
      lastHookAt: lastHook?.at ?? null,
    };
  }, [hooks, prompts, feed]);
}
