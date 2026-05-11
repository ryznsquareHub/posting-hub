import type { Platform } from "./post";

export type IntakeSource = "hook" | "manual";

export type ParseStatus = "ok" | "warn" | "error";

export interface IntakeEvent {
  id: string;
  at: string;
  source: IntakeSource;
  promptId: string | null;
  promptName: string;
  title: string;
  campaignMatched?: string;
  campaignId?: string;
  platform: Platform;
  parseStatus: ParseStatus;
  queued: boolean;
  latencyMs: number;
  warnings?: string[];
}

export interface ImportBatch {
  id: string;
  at: string;
  source: IntakeSource;
  sourceName: string;
  count: number;
  parsed: number;
  status: "applied" | "partial" | "rejected";
  summary: string;
}

export interface HookEndpoint {
  id: string;
  name: string;
  url: string;
  protocol: string;
  status: "live" | "review" | "off";
  uptime: number;
  lastPingAt: string | null;
  secret: string;
  authType: string;
  receivedToday: number;
  errorsToday: number;
  p50LatencyMs: number;
  boundPrompts: string[];
}
