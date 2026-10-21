import { ProgressSnapshot, SavedItemRecord } from "./types";

/**
 * Merges local and remote progress snapshots according to SIBIC Dev Plan (Section 4.3):
 * - XP: Math.max(local, remote)
 * - Sets: Set union (completed lessons, unlocked Sibi Cats)
 * - Saved items: Deduplicated union by (kind, itemId)
 * - Privacidad por diseño: NUNCA contiene ni toca datos de Mi Brújula
 */
export function mergeProgressSnapshots(
  local: ProgressSnapshot,
  remote: ProgressSnapshot
): ProgressSnapshot {
  const totalXp = Math.max(local.totalXp ?? 0, remote.totalXp ?? 0);

  const completedLessons = Array.from(
    new Set([...(local.completedLessons ?? []), ...(remote.completedLessons ?? [])])
  );

  const unlockedCats = Array.from(
    new Set([...(local.unlockedCats ?? []), ...(remote.unlockedCats ?? [])])
  );

  // Deduplicate saved items by kind:itemId
  const savedItemsMap = new Map<string, SavedItemRecord>();

  for (const item of local.savedItems ?? []) {
    savedItemsMap.set(`${item.kind}:${item.itemId}`, item);
  }

  for (const item of remote.savedItems ?? []) {
    const key = `${item.kind}:${item.itemId}`;
    const existing = savedItemsMap.get(key);
    if (!existing || new Date(item.savedAt) > new Date(existing.savedAt)) {
      savedItemsMap.set(key, item);
    }
  }

  return {
    totalXp,
    completedLessons,
    unlockedCats,
    savedItems: Array.from(savedItemsMap.values()),
    syncedAt: new Date().toISOString(),
  };
}
