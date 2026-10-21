import { create } from "zustand";
import { DatabaseAdapter } from "@/db/adapter/types";
import { AprendeRepository } from "@/features/aprende/repository";
import { UserAprendeProgress, calculateUserLevel } from "@/features/aprende/types";
import { BrujulaRepository } from "@/features/brujula/repository";
import { BrujulaCalculationResult, StoredBrujulaRecord } from "@/features/brujula/types";

interface UserState {
  isInitialized: boolean;
  progress: UserAprendeProgress;
  brujulaResult: StoredBrujulaRecord | null;
  loadState: (userDb: DatabaseAdapter) => Promise<void>;
  completeLesson: (
    userDb: DatabaseAdapter,
    contentDb: DatabaseAdapter,
    lessonId: string,
    xpReward: number
  ) => Promise<{ xpEarned: number; newlyUnlockedCount: number }>;
  saveBrujulaResult: (
    userDb: DatabaseAdapter,
    answers: Record<string, number>,
    result: BrujulaCalculationResult
  ) => Promise<void>;
  clearBrujulaResult: (userDb: DatabaseAdapter) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  isInitialized: false,
  progress: {
    totalXp: 0,
    completedLessonIds: [],
    unlockedCatIds: [],
    level: calculateUserLevel(0),
  },
  brujulaResult: null,

  loadState: async (userDb: DatabaseAdapter) => {
    const aprendeRepo = new AprendeRepository(userDb);
    const brujulaRepo = new BrujulaRepository(userDb);

    const [progress, brujulaResult] = await Promise.all([
      aprendeRepo.getUserProgress(),
      brujulaRepo.getLatestResult(),
    ]);

    set({
      isInitialized: true,
      progress,
      brujulaResult,
    });
  },

  completeLesson: async (userDb, contentDb, lessonId, xpReward) => {
    const aprendeRepo = new AprendeRepository(userDb, contentDb);
    const result = await aprendeRepo.completeLesson(lessonId, xpReward);
    const updatedProgress = await aprendeRepo.getUserProgress();

    set({ progress: updatedProgress });
    return {
      xpEarned: result.xpEarned,
      newlyUnlockedCount: result.newlyUnlockedCats.length,
    };
  },

  saveBrujulaResult: async (userDb, answers, result) => {
    const brujulaRepo = new BrujulaRepository(userDb);
    await brujulaRepo.saveResult(answers, result);
    const updated = await brujulaRepo.getLatestResult();
    set({ brujulaResult: updated });
  },

  clearBrujulaResult: async (userDb) => {
    const brujulaRepo = new BrujulaRepository(userDb);
    await brujulaRepo.clearResult();
    set({ brujulaResult: null });
  },
}));
