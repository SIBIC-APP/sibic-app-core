import {
  LessonType,
  ModuleType,
  SibiCatVariantType,
} from "@content-schema";
import { DatabaseAdapter } from "@/db/adapter/types";
import {
  calculateUserLevel,
  CompleteLessonResult,
  SibiCatWithStatus,
  UserAprendeProgress,
} from "./types";

export interface ModuleWithLessons extends ModuleType {
  lessons: LessonType[];
  completedLessonCount: number;
}

export class AprendeRepository {
  constructor(
    private readonly userDb: DatabaseAdapter,
    private readonly contentDb?: DatabaseAdapter
  ) {}

  // -------------------------------------------------------------
  // user db progreso y desbloqueos de sibi cat
  // -------------------------------------------------------------
  async getUserProgress(): Promise<UserAprendeProgress> {
    const progressRows = await this.userDb.all<{ lesson_id: string; xp: number }>(
      "SELECT lesson_id, xp FROM progress;"
    );

    const catRows = await this.userDb.all<{ cat_id: string }>(
      "SELECT cat_id FROM unlocked_cat;"
    );

    const totalXp = progressRows.reduce((sum, row) => sum + row.xp, 0);
    const completedLessonIds = progressRows.map((r) => r.lesson_id);
    const unlockedCatIds = catRows.map((r) => r.cat_id);

    return {
      totalXp,
      completedLessonIds,
      unlockedCatIds,
      level: calculateUserLevel(totalXp),
    };
  }

  async completeLesson(
    lessonId: string,
    xpReward: number
  ): Promise<CompleteLessonResult> {
    const now = new Date().toISOString();

    // verificar si ya fue completada
    const existing = await this.userDb.getFirst<{ lesson_id: string }>(
      "SELECT lesson_id FROM progress WHERE lesson_id = ?;",
      [lessonId]
    );

    const isFirstCompletion = !existing;

    if (isFirstCompletion) {
      await this.userDb.run(
        "INSERT INTO progress (lesson_id, completed_at, xp) VALUES (?, ?, ?);",
        [lessonId, now, xpReward]
      );
    }

    // obtener total de xp actual
    const progressRows = await this.userDb.all<{ xp: number }>(
      "SELECT xp FROM progress;"
    );
    const totalXp = progressRows.reduce((sum, r) => sum + r.xp, 0);

    // evaluar nuevos sibi cats desbloqueados
    const newlyUnlockedCats: SibiCatVariantType[] = [];

    if (this.contentDb) {
      const allCats = await this.contentDb.all<{
        id: string;
        name: string;
        title: string;
        description: string;
        required_xp: number;
        badge: string;
      }>("SELECT id, name, title, description, required_xp, badge FROM sibi_cat_definition;");

      const unlockedRows = await this.userDb.all<{ cat_id: string }>(
        "SELECT cat_id FROM unlocked_cat;"
      );
      const alreadyUnlockedSet = new Set(unlockedRows.map((r) => r.cat_id));

      for (const cat of allCats) {
        if (totalXp >= cat.required_xp && !alreadyUnlockedSet.has(cat.id)) {
          await this.userDb.run(
            "INSERT INTO unlocked_cat (cat_id, unlocked_at) VALUES (?, ?);",
            [cat.id, now]
          );
          newlyUnlockedCats.push({
            id: cat.id,
            name: cat.name,
            title: cat.title,
            description: cat.description,
            requiredXp: cat.required_xp,
            badge: cat.badge,
          });
        }
      }
    }

    return {
      lessonId,
      xpEarned: isFirstCompletion ? xpReward : 0,
      totalXp,
      newlyUnlockedCats,
      isFirstCompletion,
    };
  }

  // -------------------------------------------------------------
  // content db modulos lecciones y gatos
  // -------------------------------------------------------------
  async getModulesWithLessons(): Promise<ModuleWithLessons[]> {
    if (!this.contentDb) return [];

    const modules = await this.contentDb.all<{
      id: string;
      title: string;
      description: string;
      icon: string;
      sort: number;
    }>("SELECT id, title, description, icon, sort FROM aprende_module ORDER BY sort ASC;");

    const lessons = await this.contentDb.all<{
      id: string;
      module_id: string;
      title: string;
      summary: string;
      xp_reward: number;
      estimated_minutes: number;
      blocks_json: string;
      quiz_json: string;
      sort: number;
    }>("SELECT id, module_id, title, summary, xp_reward, estimated_minutes, blocks_json, quiz_json, sort FROM aprende_lesson ORDER BY sort ASC;");

    const userProgress = await this.getUserProgress();
    const completedSet = new Set(userProgress.completedLessonIds);

    return modules.map((m) => {
      const moduleLessons: LessonType[] = lessons
        .filter((l) => l.module_id === m.id)
        .map((l) => ({
          id: l.id,
          moduleId: l.module_id,
          title: l.title,
          summary: l.summary,
          xpReward: l.xp_reward,
          estimatedMinutes: l.estimated_minutes,
          blocks: JSON.parse(l.blocks_json),
          quiz: JSON.parse(l.quiz_json),
          sort: l.sort,
        }));

      const completedCount = moduleLessons.filter((l) => completedSet.has(l.id)).length;

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        icon: m.icon,
        sort: m.sort,
        lessons: moduleLessons,
        completedLessonCount: completedCount,
      };
    });
  }

  async getLessonById(lessonId: string): Promise<LessonType | null> {
    if (!this.contentDb) return null;

    const row = await this.contentDb.getFirst<{
      id: string;
      module_id: string;
      title: string;
      summary: string;
      xp_reward: number;
      estimated_minutes: number;
      blocks_json: string;
      quiz_json: string;
      sort: number;
    }>("SELECT * FROM aprende_lesson WHERE id = ?;", [lessonId]);

    if (!row) return null;

    return {
      id: row.id,
      moduleId: row.module_id,
      title: row.title,
      summary: row.summary,
      xpReward: row.xp_reward,
      estimatedMinutes: row.estimated_minutes,
      blocks: JSON.parse(row.blocks_json),
      quiz: JSON.parse(row.quiz_json),
      sort: row.sort,
    };
  }

  async getAllSibiCats(): Promise<SibiCatWithStatus[]> {
    if (!this.contentDb) return [];

    const cats = await this.contentDb.all<{
      id: string;
      name: string;
      title: string;
      description: string;
      required_xp: number;
      badge: string;
    }>("SELECT id, name, title, description, required_xp, badge FROM sibi_cat_definition ORDER BY required_xp ASC;");

    const unlockedRows = await this.userDb.all<{ cat_id: string; unlocked_at: string }>(
      "SELECT cat_id, unlocked_at FROM unlocked_cat;"
    );

    const unlockedMap = new Map<string, string>();
    for (const r of unlockedRows) {
      unlockedMap.set(r.cat_id, r.unlocked_at);
    }

    return cats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      title: cat.title,
      description: cat.description,
      requiredXp: cat.required_xp,
      badge: cat.badge,
      isUnlocked: unlockedMap.has(cat.id),
      unlockedAt: unlockedMap.get(cat.id) ?? null,
    }));
  }
}
