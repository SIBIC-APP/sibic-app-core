import { BrujulaQuestionType } from "@content-schema";
import { BrujulaCalculationResult, BrujulaScores, QuadrantId } from "./types";

/**
 * Pure calculation function for Mi Brújula.
 * Maps 1..5 Likert answers into -100..+100 score on Economic & Social axes.
 *
 * 1 (Totalmente en desacuerdo) -> -2
 * 2 (En desacuerdo)            -> -1
 * 3 (Neutral)                  ->  0
 * 4 (De acuerdo)               -> +1
 * 5 (Totalmente de acuerdo)    -> +2
 */
export function calculateBrujulaScore(
  questions: BrujulaQuestionType[],
  answers: Record<string, number>
): BrujulaCalculationResult {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      scores: { economic: 0, social: 0 },
      quadrantId: "q1",
      completedQuestions: 0,
      totalQuestions: 0,
      percentageCompleted: 0,
    };
  }

  let ecoSum = 0;
  let ecoMaxPossible = 0;
  let socSum = 0;
  let socMaxPossible = 0;
  let completedCount = 0;

  for (const q of questions) {
    const rawAnswer = answers[q.id];
    const ecoWeight = q.weights.economic ?? 0;
    const socWeight = q.weights.social ?? 0;

    // Track total potential weight on each axis
    ecoMaxPossible += Math.abs(ecoWeight) * 2;
    socMaxPossible += Math.abs(socWeight) * 2;

    if (typeof rawAnswer === "number" && rawAnswer >= 1 && rawAnswer <= 5) {
      completedCount++;
      const normalizedScore = rawAnswer - 3; // -2, -1, 0, 1, 2
      ecoSum += normalizedScore * ecoWeight;
      socSum += normalizedScore * socWeight;
    }
  }

  const rawEconomic = ecoMaxPossible > 0 ? (ecoSum / ecoMaxPossible) * 100 : 0;
  const rawSocial = socMaxPossible > 0 ? (socSum / socMaxPossible) * 100 : 0;

  // Round to nearest integer and clamp between -100 and 100
  const economic = Math.max(-100, Math.min(100, Math.round(rawEconomic)));
  const social = Math.max(-100, Math.min(100, Math.round(rawSocial)));

  const quadrantId = determineQuadrant({ economic, social });

  return {
    scores: { economic, social },
    quadrantId,
    completedQuestions: completedCount,
    totalQuestions,
    percentageCompleted: Math.round((completedCount / totalQuestions) * 100),
  };
}

export function determineQuadrant(scores: BrujulaScores): QuadrantId {
  const { economic, social } = scores;

  if (economic <= 0 && social <= 0) {
    return "q1"; // Solidario y Garanticista (Pastel #FDE2E4)
  }
  if (economic <= 0 && social > 0) {
    return "q2"; // Comunitario y Tradicional (Pastel #DBE7FF)
  }
  if (economic > 0 && social <= 0) {
    return "q3"; // Libre Mercado y Garanticista (Pastel #D9F3E1)
  }
  return "q4"; // Libre Mercado e Institucional (Pastel #FFF1C2)
}
