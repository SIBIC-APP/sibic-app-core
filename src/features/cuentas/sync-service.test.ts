import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "@/db/adapter/node";
import { DatabaseAdapter } from "@/db/adapter/types";
import { userMigrations } from "@/db/user/migrations";
import { runMigrations } from "@/db/migrator";
import { AccountSyncService } from "./sync-service";
import { ProgressSnapshot } from "./types";

describe("AccountSyncService & User DB Persistence", () => {
  let userDb: DatabaseAdapter;

  beforeEach(async () => {
    userDb = await openNodeDatabase(":memory:");
    await runMigrations(userDb, userMigrations, "user.db");
  });

  it("reads local user snapshot excluding brujula data", async () => {
    // Populate user.db with progress and a private brujula result
    await userDb.run("INSERT INTO progress (lesson_id, completed_at, xp) VALUES (?, ?, ?);", [
      "les-1",
      "2026-10-20T00:00:00Z",
      50,
    ]);
    await userDb.run("INSERT INTO unlocked_cat (cat_id, unlocked_at) VALUES (?, ?);", [
      "cat-novato",
      "2026-10-20T00:00:00Z",
    ]);
    await userDb.run("INSERT INTO saved_item (kind, item_id, saved_at) VALUES (?, ?, ?);", [
      "candidato",
      "cand-10",
      "2026-10-20T00:00:00Z",
    ]);

    // Insert private local Brújula result
    await userDb.run(
      "INSERT INTO brujula_result (id, taken_at, answers, scores) VALUES (1, ?, ?, ?);",
      ["2026-10-20T00:00:00Z", "{}", '{"scores":{"economic":-50,"social":20}}']
    );

    const snapshot = await AccountSyncService.readLocalSnapshot(userDb);

    expect(snapshot.totalXp).toBe(50);
    expect(snapshot.completedLessons).toEqual(["les-1"]);
    expect(snapshot.unlockedCats).toEqual(["cat-novato"]);
    expect(snapshot.savedItems).toHaveLength(1);

    // Verify snapshot does not contain brujula properties
    expect(snapshot).not.toHaveProperty("brujula");
    expect(snapshot).not.toHaveProperty("scores");
  });

  it("applies merged snapshot to user.db without affecting brujula_result", async () => {
    // Existing local state
    await userDb.run("INSERT INTO progress (lesson_id, completed_at, xp) VALUES (?, ?, ?);", [
      "les-1",
      "2026-10-20T00:00:00Z",
      50,
    ]);
    await userDb.run(
      "INSERT INTO brujula_result (id, taken_at, answers, scores) VALUES (1, ?, ?, ?);",
      ["2026-10-20T00:00:00Z", '{"q1":5}', '{"scores":{"economic":100,"social":100}}']
    );

    const mergedRemote: ProgressSnapshot = {
      totalXp: 150,
      completedLessons: ["les-1", "les-2", "les-3"],
      unlockedCats: ["cat-novato", "cat-constituyente"],
      savedItems: [
        { kind: "propuesta", itemId: "prop-99", savedAt: "2026-10-20T12:00:00Z" },
      ],
      syncedAt: "2026-10-20T12:00:00Z",
    };

    await AccountSyncService.writeMergedSnapshot(userDb, mergedRemote);

    // Verify updated progress
    const progressRows = await userDb.all("SELECT * FROM progress;");
    expect(progressRows).toHaveLength(3);

    const catRows = await userDb.all("SELECT * FROM unlocked_cat;");
    expect(catRows).toHaveLength(2);

    const savedRows = await userDb.all("SELECT * FROM saved_item;");
    expect(savedRows).toHaveLength(1);

    // CRITICAL: Verify brujula_result was completely preserved
    const brujulaRow = await userDb.getFirst<{ answers: string; scores: string }>(
      "SELECT answers, scores FROM brujula_result WHERE id = 1;"
    );
    expect(brujulaRow).not.toBeNull();
    expect(brujulaRow?.answers).toBe('{"q1":5}');
    expect(brujulaRow?.scores).toContain('"economic":100');
  });
});
