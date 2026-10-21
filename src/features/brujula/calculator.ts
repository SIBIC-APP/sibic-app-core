import { BrujulaQuestionType } from "@content-schema";
import { BrujulaCalculationResult, BrujulaScores, QuadrantId } from "./types";

/**
 * funcion de calculo puro para mi brujula
 * mapea respuestas likert del 1 al 5 a un puntaje de menos 100 a mas 100 en los ejes economico y social
 *
 * 1 totalmente en desacuerdo equivale a menos 2
 * 2 en desacuerdo            equivale a menos 1
 * 3 neutral                  equivale a 0
 * 4 de acuerdo               equivale a mas 1
 * 5 totalmente de acuerdo    equivale a mas 2
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

    // registrar peso maximo posible en cada eje
    ecoMaxPossible += Math.abs(ecoWeight) * 2;
    socMaxPossible += Math.abs(socWeight) * 2;

    if (typeof rawAnswer === "number" && rawAnswer >= 1 && rawAnswer <= 5) {
      completedCount++;
      const normalizedScore = rawAnswer - 3; // menos 2, menos 1, 0, 1, 2
      ecoSum += normalizedScore * ecoWeight;
      socSum += normalizedScore * socWeight;
    }
  }

  const rawEconomic = ecoMaxPossible > 0 ? (ecoSum / ecoMaxPossible) * 100 : 0;
  const rawSocial = socMaxPossible > 0 ? (socSum / socMaxPossible) * 100 : 0;

  // redondear al entero mas cercano y limitar entre menos 100 y 100
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
    return "q1"; // solidario y garanticista color pastel #fde2e4
  }
  if (economic <= 0 && social > 0) {
    return "q2"; // comunitario y tradicional color pastel #dbe7ff
  }
  if (economic > 0 && social <= 0) {
    return "q3"; // libre mercado y garanticista color pastel #d9f3e1
  }
  return "q4"; // libre mercado e institucional color pastel #fff1c2
}
