import { ProgressSnapshot, SavedItemRecord } from "./types";

/**
 * fusiona instantaneas de progreso local y remoto segun plan de desarrollo seccion 4.3
 * - xp: maximo entre local y remoto
 * - conjuntos: union de conjuntos de lecciones completadas y sibi cats desbloqueados
 * - elementos guardados: union deduplicada por tipo y id de elemento
 * - privacidad por diseno: nunca contiene ni toca datos de mi brujula
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

  // deduplicar elementos guardados por clave de tipo y elemento
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
