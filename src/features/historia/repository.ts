import { DatabaseAdapter } from "@/db/adapter/types";

export interface HistoryEventItem {
  id: string;
  periodId: string;
  title: string;
  year: number;
  dateDisplay: string | null;
  summary: string;
  details: string | null;
  sourceId: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  sort: number;
}

export interface HistoryPeriodWithEvents {
  id: string;
  title: string;
  startYear: number;
  endYear: number | null;
  summary: string;
  sort: number;
  events: HistoryEventItem[];
}

export class HistoriaRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  async getAllPeriods(): Promise<HistoryPeriodWithEvents[]> {
    const periods = await this.db.all<{
      id: string;
      title: string;
      start_year: number;
      end_year: number | null;
      summary: string;
      sort: number;
    }>("SELECT id, title, start_year, end_year, summary, sort FROM history_period ORDER BY sort ASC;");

    const events = await this.db.all<{
      id: string;
      period_id: string;
      title: string;
      year: number;
      date_display: string | null;
      summary: string;
      details: string | null;
      source_id: string | null;
      source_title: string | null;
      source_url: string | null;
      sort: number;
    }>(`
      SELECT e.id, e.period_id, e.title, e.year, e.date_display, e.summary, e.details,
             e.source_id, e.sort, s.title as source_title, s.url as source_url
      FROM history_event e
      LEFT JOIN source s ON e.source_id = s.id
      ORDER BY e.sort ASC;
    `);

    return periods.map((p) => ({
      id: p.id,
      title: p.title,
      startYear: p.start_year,
      endYear: p.end_year,
      summary: p.summary,
      sort: p.sort,
      events: events
        .filter((e) => e.period_id === p.id)
        .map((e) => ({
          id: e.id,
          periodId: e.period_id,
          title: e.title,
          year: e.year,
          dateDisplay: e.date_display,
          summary: e.summary,
          details: e.details,
          sourceId: e.source_id,
          sourceTitle: e.source_title,
          sourceUrl: e.source_url,
          sort: e.sort,
        })),
    }));
  }

  async getEventById(eventId: string): Promise<HistoryEventItem | null> {
    const row = await this.db.getFirst<{
      id: string;
      period_id: string;
      title: string;
      year: number;
      date_display: string | null;
      summary: string;
      details: string | null;
      source_id: string | null;
      source_title: string | null;
      source_url: string | null;
      sort: number;
    }>(
      `
      SELECT e.id, e.period_id, e.title, e.year, e.date_display, e.summary, e.details,
             e.source_id, e.sort, s.title as source_title, s.url as source_url
      FROM history_event e
      LEFT JOIN source s ON e.source_id = s.id
      WHERE e.id = ?;
    `,
      [eventId]
    );

    if (!row) return null;

    return {
      id: row.id,
      periodId: row.period_id,
      title: row.title,
      year: row.year,
      dateDisplay: row.date_display,
      summary: row.summary,
      details: row.details,
      sourceId: row.source_id,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
      sort: row.sort,
    };
  }
}
