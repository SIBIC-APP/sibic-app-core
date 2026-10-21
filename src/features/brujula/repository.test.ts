import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "@/db/adapter/node";
import { DatabaseAdapter } from "@/db/adapter/types";
import { contentMigrations } from "@/db/content/migrations";
import { userMigrations } from "@/db/user/migrations";
import { runMigrations } from "@/db/migrator";
import { ensureEmbeddedSeeds } from "@/content/seed";
import { BrujulaRepository } from "./repository";

describe("BrujulaRepository", () => {
  let userDb: DatabaseAdapter;
  let contentDb: DatabaseAdapter;
  let repo: BrujulaRepository;

  beforeEach(async () => {
    userDb = await openNodeDatabase(":memory:");
    contentDb = await openNodeDatabase(":memory:");

    await runMigrations(userDb, userMigrations, "user.db");
    await runMigrations(contentDb, contentMigrations, "content.db");
    await ensureEmbeddedSeeds(contentDb);

    repo = new BrujulaRepository(userDb, contentDb);
  });

  it("loads questions, dimensions and quadrants from content.db", async () => {
    const questions = await repo.getQuestions();
    const dimensions = await repo.getDimensions();
    const quadrants = await repo.getQuadrants();

    expect(questions.length).toBeGreaterThanOrEqual(8);
    expect(dimensions.length).toBe(2);
    expect(quadrants.length).toBe(4);

    expect(questions[0].weights).toHaveProperty("economic");
    expect(questions[0].weights).toHaveProperty("social");
  });

  it("saves and retrieves user brujula test result exclusively in user.db", async () => {
    const initial = await repo.getLatestResult();
    expect(initial).toBeNull();

    const answers = { "q-eco-1": 5, "q-eco-2": 4 };
    const calculation = {
      scores: { economic: 35, social: -15 },
      quadrantId: "q3" as const,
      completedQuestions: 2,
      totalQuestions: 8,
      percentageCompleted: 25,
    };

    await repo.saveResult(answers, calculation);

    const saved = await repo.getLatestResult();
    expect(saved).not.toBeNull();
    expect(saved?.scores.economic).toBe(35);
    expect(saved?.scores.social).toBe(-15);
    expect(saved?.quadrantId).toBe("q3");
    expect(saved?.answers["q-eco-1"]).toBe(5);
    expect(saved?.takenAt).toBeDefined();

    // limpiar resultado
    await repo.clearResult();
    const afterClear = await repo.getLatestResult();
    expect(afterClear).toBeNull();
  });
});
