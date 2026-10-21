import { SibiCatVariantType } from "@content-schema";

export interface UserLevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  progressPercent: number;
}

export interface UserAprendeProgress {
  totalXp: number;
  completedLessonIds: string[];
  unlockedCatIds: string[];
  level: UserLevelInfo;
}

export interface CompleteLessonResult {
  lessonId: string;
  xpEarned: number;
  totalXp: number;
  newlyUnlockedCats: SibiCatVariantType[];
  isFirstCompletion: boolean;
}

export interface SibiCatWithStatus extends SibiCatVariantType {
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export function calculateUserLevel(totalXp: number): UserLevelInfo {
  if (totalXp < 100) {
    return {
      level: 1,
      title: "Ciudadano Curioso",
      minXp: 0,
      maxXp: 100,
      progressPercent: Math.min(100, Math.round((totalXp / 100) * 100)),
    };
  }
  if (totalXp < 250) {
    return {
      level: 2,
      title: "Observador Cívico",
      minXp: 100,
      maxXp: 250,
      progressPercent: Math.min(100, Math.round(((totalXp - 100) / 150) * 100)),
    };
  }
  if (totalXp < 500) {
    return {
      level: 3,
      title: "Analista Democrático",
      minXp: 250,
      maxXp: 500,
      progressPercent: Math.min(100, Math.round(((totalXp - 250) / 250) * 100)),
    };
  }
  return {
    level: 4,
    title: "Líder Comunitario",
    minXp: 500,
    maxXp: 1000,
    progressPercent: 100,
  };
}
