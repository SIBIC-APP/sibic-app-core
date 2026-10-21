export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl: string | null;
  provider: string | null;
}

export interface SavedItemRecord {
  kind: string;
  itemId: string;
  savedAt: string;
}

export interface ProgressSnapshot {
  totalXp: number;
  completedLessons: string[];
  unlockedCats: string[];
  savedItems: SavedItemRecord[];
  syncedAt: string;
}

export type CloudSyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";
