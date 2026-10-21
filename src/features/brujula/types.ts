import { BrujulaQuadrantType, BrujulaQuestionType } from "@content-schema";

export type QuadrantId = "q1" | "q2" | "q3" | "q4";

export interface BrujulaScores {
  economic: number; // -100 to +100
  social: number;   // -100 to +100
}

export interface BrujulaCalculationResult {
  scores: BrujulaScores;
  quadrantId: QuadrantId;
  completedQuestions: number;
  totalQuestions: number;
  percentageCompleted: number;
}

export interface StoredBrujulaRecord {
  takenAt: string;
  answers: Record<string, number>;
  scores: BrujulaScores;
  quadrantId: QuadrantId;
}

export interface BrujulaOptionItem {
  value: number; // 1 to 5
  label: string;
  shortLabel: string;
}

export const BRUJULA_OPTIONS: BrujulaOptionItem[] = [
  { value: 1, label: "Totalmente en desacuerdo", shortLabel: "--" },
  { value: 2, label: "En desacuerdo", shortLabel: "-" },
  { value: 3, label: "Neutral / Sin postura", shortLabel: "0" },
  { value: 4, label: "De acuerdo", shortLabel: "+" },
  { value: 5, label: "Totalmente de acuerdo", shortLabel: "++" },
];
