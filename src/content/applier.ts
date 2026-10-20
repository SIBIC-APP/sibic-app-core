import { HistoryPackType } from "@content-schema";
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

      // 1. Upsert sources
      for (const src of historyData.sources) {
        await tx.run(
          `INSERT OR REPLACE INTO source (id, title, url, publisher, retrieved_at)
           VALUES (?, ?, ?, ?, ?);`,
          [src.id, src.title, src.url, src.publisher ?? null, src.retrievedAt]
        );
      }

      // 2. Clear old history data atomically
      await tx.exec("DELETE FROM history_event;");
      await tx.exec("DELETE FROM history_period;");

      // 3. Insert periods
      for (const p of historyData.periods) {
        await tx.run(
          `INSERT INTO history_period (id, title, start_year, end_year, summary, sort)
           VALUES (?, ?, ?, ?, ?, ?);`,
          [p.id, p.title, p.startYear, p.endYear ?? null, p.summary, p.sort]
        );
      }

      // 4. Insert events
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
    } else {
      throw new Error(`Unsupported pack domain: "${packId}"`);
    }

    // 5. Update applied_pack metadata
    await tx.run(
      `INSERT OR REPLACE INTO applied_pack (id, version, applied_at, sha256)
       VALUES (?, ?, ?, ?);`,
      [packId, version, now, sha256]
    );
  });
}
