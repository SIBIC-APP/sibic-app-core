import { ManifestType, PackRefType } from "@content-schema";

export type SyncStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "applying"
  | "up_to_date"
  | "error"
  | "app_update_required";

export interface SyncOptions {
  manifestUrl: string;
  currentAppVersion: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export interface AppliedPackRow {
  id: string;
  version: number;
  applied_at: string;
  sha256: string;
}

export interface SyncResult {
  success: boolean;
  status: SyncStatus;
  appliedPacks: string[];
  skippedPacks: string[];
  errors: string[];
  manifest?: ManifestType;
  updateRequired?: boolean;
}
