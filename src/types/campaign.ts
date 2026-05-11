import type { Platform } from "./post";

export interface CampaignHookStatus {
  connected: boolean;
  lastReceivedAt?: string | null;
  receivedCount?: number;
  errorCount?: number;
}

export interface VariantPreset {
  id: string;
  name: string;
  platform: Platform;
  style: string;
  template: string;
}

export interface CampaignSettings {
  brand: string;
  platforms: Platform[];
  cta: string;
  tone: string;
  audience: string;
  keywords: string[];
}

export interface Campaign {
  id: string;
  name: string;
  region: string;
  industry: string;
  color: string;
  clientNote: string;
  startedAt: string;
  settings?: CampaignSettings;
  variantIds?: string[];
  activeVariantId?: string;
  hook?: CampaignHookStatus;
  variants?: VariantPreset[];
}
