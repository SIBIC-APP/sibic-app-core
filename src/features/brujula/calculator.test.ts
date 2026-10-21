import { describe, it, expect } from "vitest";
import { BrujulaQuestionType } from "@content-schema";
import { calculateBrujulaScore, determineQuadrant } from "./calculator";

describe("Mi Brújula Calculation Engine", () => {
  const sampleQuestions: BrujulaQuestionType[] = [
    {
      id: "q1",
      topic: "Economía",
      text: "Pregunta económica directa",
      context: "Contexto",
      weights: { economic: 1.0, social: 0.0 },
      sort: 1,
    },
    {
      id: "q2",
      topic: "Economía Inversa",
      text: "Pregunta económica inversa",
      context: "Contexto",
      weights: { economic: -1.0, social: 0.0 },
      sort: 2,
    },
    {
      id: "q3",
      topic: "Social",
      text: "Pregunta social directa",
      context: "Contexto",
      weights: { economic: 0.0, social: 1.0 },
      sort: 3,
    },
    {
      id: "q4",
      topic: "Social Inversa",
      text: "Pregunta social inversa",
      context: "Contexto",
      weights: { economic: 0.0, social: -1.0 },
      sort: 4,
    },
  ];

  it("calculates (0, 0) and neutral quadrant when all answers are neutral (3)", () => {
    const answers = { q1: 3, q2: 3, q3: 3, q4: 3 };
    const result = calculateBrujulaScore(sampleQuestions, answers);

    expect(result.scores.economic).toBe(0);
    expect(result.scores.social).toBe(0);
    expect(result.quadrantId).toBe("q1");
    expect(result.percentageCompleted).toBe(100);
  });

  it("calculates maximum positive scores (+100, +100) and quadrant q4 when aligned strongly with positive weights", () => {
    // q1 peso mas 1.0 respuesta 5 equivalente a mas 2
    // q2 peso menos 1.0 respuesta 1 equivalente a mas 2
    // q3 peso mas 1.0 respuesta 5 equivalente a mas 2
    // q4 peso menos 1.0 respuesta 1 equivalente a mas 2
    const answers = { q1: 5, q2: 1, q3: 5, q4: 1 };
    const result = calculateBrujulaScore(sampleQuestions, answers);

    expect(result.scores.economic).toBe(100);
    expect(result.scores.social).toBe(100);
    expect(result.quadrantId).toBe("q4");
  });

  it("calculates maximum negative scores (-100, -100) and quadrant q1 when aligned strongly with negative weights", () => {
    // q1 peso mas 1.0 respuesta 1 equivalente a menos 2
    // q2 peso menos 1.0 respuesta 5 equivalente a menos 2
    // q3 peso mas 1.0 respuesta 1 equivalente a menos 2
    // q4 peso menos 1.0 respuesta 5 equivalente a menos 2
    const answers = { q1: 1, q2: 5, q3: 1, q4: 5 };
    const result = calculateBrujulaScore(sampleQuestions, answers);

    expect(result.scores.economic).toBe(-100);
    expect(result.scores.social).toBe(-100);
    expect(result.quadrantId).toBe("q1");
  });

  it("correctly identifies all 4 quadrants based on signs", () => {
    expect(determineQuadrant({ economic: -50, social: -30 })).toBe("q1");
    expect(determineQuadrant({ economic: -40, social: 60 })).toBe("q2");
    expect(determineQuadrant({ economic: 70, social: -20 })).toBe("q3");
    expect(determineQuadrant({ economic: 50, social: 50 })).toBe("q4");
  });

  it("handles empty or incomplete answers gracefully without NaN or throwing", () => {
    const emptyResult = calculateBrujulaScore([], {});
    expect(emptyResult.scores.economic).toBe(0);
    expect(emptyResult.scores.social).toBe(0);
    expect(emptyResult.percentageCompleted).toBe(0);

    // respondido parcialmente 2 de 4
    const partialResult = calculateBrujulaScore(sampleQuestions, { q1: 5 });
    expect(partialResult.completedQuestions).toBe(1);
    expect(partialResult.totalQuestions).toBe(4);
    expect(partialResult.percentageCompleted).toBe(25);
    expect(Number.isNaN(partialResult.scores.economic)).toBe(false);
  });
});
