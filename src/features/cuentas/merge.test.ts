import { describe, it, expect } from "vitest";
import { mergeProgressSnapshots } from "./merge";
import { ProgressSnapshot } from "./types";

describe("Cloud Progress Merge Engine (Fase 3)", () => {
  it("merges snapshots by taking max(XP) and union of completed lessons and Sibi Cats", () => {
    const localSnapshot: ProgressSnapshot = {
      totalXp: 120,
      completedLessons: ["les-estado-1", "les-elecciones-1"],
      unlockedCats: ["cat-novato", "cat-constituyente"],
      savedItems: [
        { kind: "propuesta", itemId: "prop-1", savedAt: "2026-10-20T10:00:00Z" },
      ],
      syncedAt: "2026-10-20T10:00:00Z",
    };

    const remoteSnapshot: ProgressSnapshot = {
      totalXp: 180, // mayor cantidad de xp
      completedLessons: ["les-elecciones-1", "les-desinfo-1"], // contiene les-desinfo-1
      unlockedCats: ["cat-constituyente", "cat-detective"],   // contiene cat-detective
      savedItems: [
        { kind: "propuesta", itemId: "prop-1", savedAt: "2026-10-20T12:00:00Z" },
        { kind: "candidato", itemId: "cand-42", savedAt: "2026-10-20T11:00:00Z" },
      ],
      syncedAt: "2026-10-20T12:00:00Z",
    };

    const merged = mergeProgressSnapshots(localSnapshot, remoteSnapshot);

    // maximo xp
    expect(merged.totalXp).toBe(180);

    // union de lecciones completadas
    expect(merged.completedLessons).toHaveLength(3);
    expect(merged.completedLessons).toContain("les-estado-1");
    expect(merged.completedLessons).toContain("les-elecciones-1");
    expect(merged.completedLessons).toContain("les-desinfo-1");

    // union de gatos desbloqueados
    expect(merged.unlockedCats).toHaveLength(3);
    expect(merged.unlockedCats).toContain("cat-novato");
    expect(merged.unlockedCats).toContain("cat-constituyente");
    expect(merged.unlockedCats).toContain("cat-detective");

    // elementos guardados deduplicados
    expect(merged.savedItems).toHaveLength(2);
    const prop1 = merged.savedItems.find((i) => i.itemId === "prop-1");
    expect(prop1?.savedAt).toBe("2026-10-20T12:00:00Z"); // conserva la marca de tiempo mas reciente
  });

  it("handles empty local or empty remote snapshots safely", () => {
    const emptyLocal: ProgressSnapshot = {
      totalXp: 0,
      completedLessons: [],
      unlockedCats: [],
      savedItems: [],
      syncedAt: "2026-10-20T00:00:00Z",
    };

    const remoteSnapshot: ProgressSnapshot = {
      totalXp: 250,
      completedLessons: ["les-1"],
      unlockedCats: ["cat-1"],
      savedItems: [],
      syncedAt: "2026-10-20T01:00:00Z",
    };

    const merged = mergeProgressSnapshots(emptyLocal, remoteSnapshot);
    expect(merged.totalXp).toBe(250);
    expect(merged.completedLessons).toEqual(["les-1"]);
    expect(merged.unlockedCats).toEqual(["cat-1"]);
  });
});
