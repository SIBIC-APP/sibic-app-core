import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "@/db/adapter/node";
import { DatabaseAdapter } from "@/db/adapter/types";
import { contentMigrations } from "@/db/content/migrations";
import { userMigrations } from "@/db/user/migrations";
import { runMigrations } from "@/db/migrator";
import { ensureEmbeddedSeeds } from "@/content/seed";
import { AprendeRepository } from "./repository";

describe("AprendeRepository", () => {
  let userDb: DatabaseAdapter;
  let contentDb: DatabaseAdapter;
  let repo: AprendeRepository;

  beforeEach(async () => {
    userDb = await openNodeDatabase(":memory:");
    contentDb = await openNodeDatabase(":memory:");

    await runMigrations(userDb, userMigrations, "user.db");
    await runMigrations(contentDb, contentMigrations, "content.db");
    await ensureEmbeddedSeeds(contentDb);

    repo = new AprendeRepository(userDb, contentDb);
  });

  it("fetches modules and lessons with initial 0 completion status", async () => {
    const modules = await repo.getModulesWithLessons();
    expect(modules.length).toBeGreaterThanOrEqual(3);

    const firstModule = modules[0];
    expect(firstModule.lessons.length).toBeGreaterThan(0);
    expect(firstModule.completedLessonCount).toBe(0);

    const firstLesson = firstModule.lessons[0];
    expect(firstLesson.blocks.length).toBeGreaterThan(0);
    expect(firstLesson.quiz.length).toBeGreaterThan(0);
    expect(firstLesson.quiz[0].options.length).toBeGreaterThanOrEqual(2);
  });

  it("completes a lesson, adds XP and calculates level up", async () => {
    const initialProgress = await repo.getUserProgress();
    expect(initialProgress.totalXp).toBe(0);
    expect(initialProgress.level.level).toBe(1);

    // Complete lesson 1 (50 XP)
    const result1 = await repo.completeLesson("les-estado-1", 50);
    expect(result1.isFirstCompletion).toBe(true);
    expect(result1.xpEarned).toBe(50);
    expect(result1.totalXp).toBe(50);

    const progressAfter1 = await repo.getUserProgress();
    expect(progressAfter1.totalXp).toBe(50);
    expect(progressAfter1.completedLessonIds).toContain("les-estado-1");

    // Repeat lesson 1 should not give duplicate XP
    const repeatResult = await repo.completeLesson("les-estado-1", 50);
    expect(repeatResult.isFirstCompletion).toBe(false);
    expect(repeatResult.xpEarned).toBe(0);
    expect(repeatResult.totalXp).toBe(50);

    // Complete lesson 2 (50 XP) -> reaches 100 XP -> Level 2 ("Observador Cívico")
    const result2 = await repo.completeLesson("les-elecciones-1", 50);
    expect(result2.totalXp).toBe(100);

    const progressAfter2 = await repo.getUserProgress();
    expect(progressAfter2.level.level).toBe(2);
    expect(progressAfter2.level.title).toBe("Observador Cívico");
  });

  it("automatically unlocks Sibi Cat variants when user earns the required XP", async () => {
    // Sibi Cat Constituyente requires 50 XP
    // Sibi Cat Detective Cívico requires 100 XP
    const catsInitial = await repo.getAllSibiCats();
    const novatoCat = catsInitial.find((c) => c.id === "cat-novato");
    const constituyenteCat = catsInitial.find((c) => c.id === "cat-constituyente");

    // Novato requires 0 XP, unlocks when reaching or evaluating
    expect(constituyenteCat?.isUnlocked).toBe(false);

    // Complete lesson with 60 XP
    await repo.completeLesson("les-1", 60);

    const catsAfter60 = await repo.getAllSibiCats();
    const constituyenteAfter = catsAfter60.find((c) => c.id === "cat-constituyente");
    expect(constituyenteAfter?.isUnlocked).toBe(true);
    expect(constituyenteAfter?.unlockedAt).toBeDefined();

    const detectiveAfter = catsAfter60.find((c) => c.id === "cat-detective");
    expect(detectiveAfter?.isUnlocked).toBe(false); // requires 100 XP
  });
});
