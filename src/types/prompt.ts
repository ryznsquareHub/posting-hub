import type { Platform } from "./post";

export interface Prompt {
  id: string;
  name: string;
  category: string;
  platform: Platform;
  description: string;
  variables: string[];
  outputFormat: string;
  body: string;
  webhookEnabled: boolean;
  autoParse: boolean;
  schedule?: string | null;
  uses: number;
  lastRunAt?: string | null;
  lastRunStatus?: "ok" | "warn" | "error" | "manual" | "review";
  lastRunCount: number;
  successRate: number;
  updatedAt: string;
}

export interface PostTemplate {
  id: string;
  platform: Platform;
  name: string;
  uses: number;
  updatedAt: string;
}
