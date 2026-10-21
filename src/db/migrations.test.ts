import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "./adapter/node";
import { DatabaseAdapter } from "./adapter/types";
import { contentMigrations } from "./content/migrations";
import { userMigrations } from "./user/migrations";
import { runMigrations } from "./migrator";

describe("Database Migrations", () => {
  let db: DatabaseAdapter;

  beforeEach(async () => {
    db = await openNodeDatabase(":memory:");
  });

  it("applies content.db migrations and bumps user_version", async () => {
    const version0 = await db.getFirst<{ user_version: number }>("PRAGMA user_version;");
    expect(version0?.user_version).toBe(0);

    const versionAfterMigrations = await runMigrations(db, contentMigrations, "content.db");
    expect(versionAfterMigrations).toBe(contentMigrations.length);

    // verificar que existan las tablas principales
    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("applied_pack");
    expect(tableNames).toContain("source");
    expect(tableNames).toContain("party");
    expect(tableNames).toContain("candidate");
    expect(tableNames).toContain("topic");
    expect(tableNames).toContain("proposal");
    expect(tableNames).toContain("history_period");
    expect(tableNames).toContain("history_event");
    expect(tableNames).toContain("aprende_module");
    expect(tableNames).toContain("aprende_lesson");
    expect(tableNames).toContain("brujula_question");
    expect(tableNames).toContain("brujula_quadrant");

    // ejecutar de nuevo no debe realizar cambios y debe mantener la version actual
    const versionAfterNoop = await runMigrations(db, contentMigrations, "content.db");
    expect(versionAfterNoop).toBe(contentMigrations.length);
  });

  it("applies user.db migrations and protects user tables", async () => {
    const version = await runMigrations(db, userMigrations, "user.db");
    expect(version).toBe(1);

    const tables = await db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table';"
    );
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain("progress");
    expect(tableNames).toContain("unlocked_cat");
    expect(tableNames).toContain("saved_item");
    expect(tableNames).toContain("brujula_result");
  });
});
