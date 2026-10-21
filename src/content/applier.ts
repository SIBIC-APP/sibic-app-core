import {
  AprendePackType,
  BrujulaPackType,
  HistoryPackType,
} from "@content-schema";
import { DatabaseAdapter } from "../db/adapter/types";

export interface ApplyPackOptions {
  packId: string;
  version: number;
  sha256: string;
  data: unknown;
}

export async function applyPack(
  db: DatabaseAdapter,
  options: ApplyPackOptions
): Promise<void> {
  const { packId, version, sha256, data } = options;

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();

    if (packId === "historia") {
      const historyData = data as HistoryPackType;

      for (const src of historyData.sources) {
        await tx.run(
          `INSERT OR REPLACE INTO source (id, title, url, publisher, retrieved_at)
           VALUES (?, ?, ?, ?, ?);`,
          [src.id, src.title, src.url, src.publisher ?? null, src.retrievedAt]
        );
      }

      await tx.exec("DELETE FROM history_event;");
      await tx.exec("DELETE FROM history_period;");

      for (const p of historyData.periods) {
        await tx.run(
          `INSERT INTO history_period (id, title, start_year, end_year, summary, sort)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [p.id, p.title, p.startYear, p.endYear ?? null, p.summary, p.sort]
        );
      }

      for (const ev of historyData.events) {
        await tx.run(
          `INSERT INTO history_event (id, period_id, title, year, date_display, summary, details, source_id, sort)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            ev.id,
            ev.periodId,
            ev.title,
            ev.year,
            ev.dateDisplay ?? null,
            ev.summary,
            ev.details ?? null,
            ev.sourceId ?? null,
            ev.sort,
          ]
        );
      }
    } else if (packId === "brujula") {
      const brujulaData = data as BrujulaPackType;

      await tx.exec("DELETE FROM brujula_question;");
      await tx.exec("DELETE FROM brujula_quadrant;");
      await tx.exec("DELETE FROM brujula_dimension;");

      for (const dim of brujulaData.dimensions) {
        await tx.run(
          `INSERT INTO brujula_dimension (id, name, min_label, max_label, description)
           VALUES (?, ?, ?, ?, ?);`,
          [dim.id, dim.name, dim.minLabel, dim.maxLabel, dim.description]
        );
      }

      for (const quad of brujulaData.quadrants) {
        await tx.run(
          `INSERT INTO brujula_quadrant (id, title, short_description, detailed_explanation, color_token)
           VALUES (?, ?, ?, ?, ?);`,
          [quad.id, quad.title, quad.shortDescription, quad.detailedExplanation, quad.colorToken]
        );
      }

      for (const q of brujulaData.questions) {
        await tx.run(
          `INSERT INTO brujula_question (id, topic, text, context, weights_json, sort)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [q.id, q.topic, q.text, q.context, JSON.stringify(q.weights), q.sort]
        );
      }
    } else if (packId === "aprende") {
      const aprendeData = data as AprendePackType;

      await tx.exec("DELETE FROM aprende_lesson;");
      await tx.exec("DELETE FROM aprende_module;");
      await tx.exec("DELETE FROM sibi_cat_definition;");

      for (const mod of aprendeData.modules) {
        await tx.run(
          `INSERT INTO aprende_module (id, title, description, icon, sort)
           VALUES (?, ?, ?, ?, ?);`,
          [mod.id, mod.title, mod.description, mod.icon, mod.sort]
        );
      }

      for (const les of aprendeData.lessons) {
        await tx.run(
          `INSERT INTO aprende_lesson (id, module_id, title, summary, xp_reward, estimated_minutes, blocks_json, quiz_json, sort)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            les.id,
            les.moduleId,
            les.title,
            les.summary,
            les.xpReward,
            les.estimatedMinutes,
            JSON.stringify(les.blocks),
            JSON.stringify(les.quiz),
            les.sort,
          ]
        );
      }

      for (const cat of aprendeData.sibiCats) {
        await tx.run(
          `INSERT INTO sibi_cat_definition (id, name, title, description, required_xp, badge)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [cat.id, cat.name, cat.title, cat.description, cat.requiredXp, cat.badge]
        );
      }
    } else {
      throw new Error(`Unsupported pack domain: "${packId}"`);
    }

    await tx.run(
      `INSERT OR REPLACE INTO applied_pack (id, version, applied_at, sha256)
       VALUES (?, ?, ?, ?);`,
      [packId, version, now, sha256]
    );
  });
}
