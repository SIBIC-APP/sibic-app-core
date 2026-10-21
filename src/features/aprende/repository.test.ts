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

    // completar leccion 1 con 50 xp
    const result1 = await repo.completeLesson("les-estado-1", 50);
    expect(result1.isFirstCompletion).toBe(true);
    expect(result1.xpEarned).toBe(50);
    expect(result1.totalXp).toBe(50);

    const progressAfter1 = await repo.getUserProgress();
    expect(progressAfter1.totalXp).toBe(50);
    expect(progressAfter1.completedLessonIds).toContain("les-estado-1");

    // repetir leccion 1 no debe otorgar xp duplicado
    const repeatResult = await repo.completeLesson("les-estado-1", 50);
    expect(repeatResult.isFirstCompletion).toBe(false);
    expect(repeatResult.xpEarned).toBe(0);
    expect(repeatResult.totalXp).toBe(50);

    // completar leccion 2 con 50 xp alcanzando 100 xp para subir a nivel 2
    const result2 = await repo.completeLesson("les-elecciones-1", 50);
    expect(result2.totalXp).toBe(100);

    const progressAfter2 = await repo.getUserProgress();
    expect(progressAfter2.level.level).toBe(2);
    expect(progressAfter2.level.title).toBe("Observador Cívico");
  });

  it("automatically unlocks Sibi Cat variants when user earns the required XP", async () => {
    // sibi cat constituyente requiere 50 xp
    // sibi cat detective civico requiere 100 xp
    const catsInitial = await repo.getAllSibiCats();
    const novatoCat = catsInitial.find((c) => c.id === "cat-novato");
    const constituyenteCat = catsInitial.find((c) => c.id === "cat-constituyente");

    // novato requiere 0 xp se desbloquea al evaluar
    expect(constituyenteCat?.isUnlocked).toBe(false);

    // completar leccion con 60 xp
    await repo.completeLesson("les-1", 60);

    const catsAfter60 = await repo.getAllSibiCats();
    const constituyenteAfter = catsAfter60.find((c) => c.id === "cat-constituyente");
    expect(constituyenteAfter?.isUnlocked).toBe(true);
    expect(constituyenteAfter?.unlockedAt).toBeDefined();

    const detectiveAfter = catsAfter60.find((c) => c.id === "cat-detective");
    expect(detectiveAfter?.isUnlocked).toBe(false); // requiere 100 xp
  });
});
