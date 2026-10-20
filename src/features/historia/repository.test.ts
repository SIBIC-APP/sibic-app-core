import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "@/db/adapter/node";
import { DatabaseAdapter } from "@/db/adapter/types";
import { contentMigrations } from "@/db/content/migrations";
import { runMigrations } from "@/db/migrator";
import { ensureEmbeddedSeeds } from "@/content/seed";
import { HistoriaRepository } from "./repository";

describe("HistoriaRepository", () => {
  let db: DatabaseAdapter;
  let repo: HistoriaRepository;

  beforeEach(async () => {
    db = await openNodeDatabase(":memory:");
    await runMigrations(db, contentMigrations, "content.db");
    await ensureEmbeddedSeeds(db);
    repo = new HistoriaRepository(db);
  });

  it("loads embedded seeds and returns periods with associated events and sources", async () => {
    const periods = await repo.getAllPeriods();

    expect(periods.length).toBeGreaterThanOrEqual(3);

    const revPeriod = periods.find((p) => p.id === "per-rev-44");
    expect(revPeriod).toBeDefined();
    expect(revPeriod?.startYear).toBe(1944);
    expect(revPeriod?.events.length).toBeGreaterThan(0);

    const firstEvent = revPeriod?.events[0];
    expect(firstEvent?.id).toBe("ev-1944-rev");
    expect(firstEvent?.title).toBe("Revolución del 20 de Octubre");
    expect(firstEvent?.sourceTitle).toBeDefined();
    expect(firstEvent?.sourceUrl).toBe("https://www.congreso.gob.gt");
  });

  it("retrieves a single event with linked source information", async () => {
    const event = await repo.getEventById("ev-1985-const");

    expect(event).not.toBeNull();
    expect(event?.year).toBe(1985);
    expect(event?.title).toContain("Constitución Política");
    expect(event?.sourceTitle).toBe("Historia y Normativa Electoral de Guatemala");
    expect(event?.sourceUrl).toBe("https://www.tse.org.gt");
  });

  it("returns null for non-existing event IDs", async () => {
    const event = await repo.getEventById("non-existent-id");
    expect(event).toBeNull();
  });
});
