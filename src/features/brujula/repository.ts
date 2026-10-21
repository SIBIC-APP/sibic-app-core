import {
  BrujulaDimensionType,
  BrujulaQuadrantType,
  BrujulaQuestionType,
} from "@content-schema";
import { DatabaseAdapter } from "@/db/adapter/types";
import {
  BrujulaCalculationResult,
  BrujulaScores,
  QuadrantId,
  StoredBrujulaRecord,
} from "./types";

export class BrujulaRepository {
  constructor(
    private readonly userDb: DatabaseAdapter,
    private readonly contentDb?: DatabaseAdapter
  ) {}

  // -------------------------------------------------------------
  // USER.DB: Stored result (100% strictly local)
  // -------------------------------------------------------------
  async saveResult(
    answers: Record<string, number>,
    result: BrujulaCalculationResult
  ): Promise<void> {
    const now = new Date().toISOString();
    const scoresJson = JSON.stringify({
      scores: result.scores,
      quadrantId: result.quadrantId,
    });
    const answersJson = JSON.stringify(answers);

    await this.userDb.run(
      `INSERT OR REPLACE INTO brujula_result (id, taken_at, answers, scores)
       VALUES (1, ?, ?, ?);`,
      [now, answersJson, scoresJson]
    );
  }

  async getLatestResult(): Promise<StoredBrujulaRecord | null> {
    const row = await this.userDb.getFirst<{
      id: number;
      taken_at: string;
      answers: string;
      scores: string;
    }>("SELECT id, taken_at, answers, scores FROM brujula_result WHERE id = 1;");

    if (!row) return null;

    try {
      const parsedScores = JSON.parse(row.scores) as {
        scores: BrujulaScores;
        quadrantId: QuadrantId;
      };
      const parsedAnswers = JSON.parse(row.answers) as Record<string, number>;

      return {
        takenAt: row.taken_at,
        answers: parsedAnswers,
        scores: parsedScores.scores,
        quadrantId: parsedScores.quadrantId,
      };
    } catch {
      return null;
    }
  }

  async clearResult(): Promise<void> {
    await this.userDb.run("DELETE FROM brujula_result WHERE id = 1;");
  }

  // -------------------------------------------------------------
  // CONTENT.DB: Questions and Quadrants
  // -------------------------------------------------------------
  async getQuestions(): Promise<BrujulaQuestionType[]> {
    if (!this.contentDb) return [];

    const rows = await this.contentDb.all<{
      id: string;
      topic: string;
      text: string;
      context: string;
      weights_json: string;
      sort: number;
    }>("SELECT id, topic, text, context, weights_json, sort FROM brujula_question ORDER BY sort ASC;");

    return rows.map((r) => ({
      id: r.id,
      topic: r.topic,
      text: r.text,
      context: r.context,
      weights: JSON.parse(r.weights_json),
      sort: r.sort,
    }));
  }

  async getQuadrants(): Promise<BrujulaQuadrantType[]> {
    if (!this.contentDb) return [];

    const rows = await this.contentDb.all<{
      id: QuadrantId;
      title: string;
      short_description: string;
      detailed_explanation: string;
      color_token: string;
    }>("SELECT id, title, short_description, detailed_explanation, color_token FROM brujula_quadrant;");

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      shortDescription: r.short_description,
      detailedExplanation: r.detailed_explanation,
      colorToken: r.color_token,
    }));
  }

  async getDimensions(): Promise<BrujulaDimensionType[]> {
    if (!this.contentDb) return [];

    const rows = await this.contentDb.all<{
      id: string;
      name: string;
      min_label: string;
      max_label: string;
      description: string;
    }>("SELECT id, name, min_label, max_label, description FROM brujula_dimension;");

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      minLabel: r.min_label,
      maxLabel: r.max_label,
      description: r.description,
    }));
  }
}
