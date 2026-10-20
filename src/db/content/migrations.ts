import { Migration } from "../migrator";

export const contentMigrations: Migration[] = [
  {
    version: 1,
    name: "001_initial_content_schema",
    up: async (db) => {
      // Applied packs tracking
      await db.exec(`
        CREATE TABLE IF NOT EXISTS applied_pack (
          id TEXT PRIMARY KEY,
          version INTEGER NOT NULL,
          applied_at TEXT NOT NULL,
          sha256 TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS source (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          url TEXT NOT NULL,
          publisher TEXT,
          retrieved_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS party (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          short_name TEXT,
          website TEXT
        );

        CREATE TABLE IF NOT EXISTS candidate (
          id TEXT PRIMARY KEY,
          election_id TEXT NOT NULL,
          party_id TEXT REFERENCES party(id),
          office TEXT NOT NULL,
          full_name TEXT NOT NULL,
          photo_url TEXT,
          bio TEXT,
          education TEXT,
          career TEXT,
          website TEXT,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS topic (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          sort INTEGER
        );

        CREATE TABLE IF NOT EXISTS proposal (
          id TEXT PRIMARY KEY,
          candidate_id TEXT,
          party_id TEXT,
          topic_id TEXT NOT NULL,
          summary TEXT NOT NULL,
          source_id TEXT NOT NULL REFERENCES source(id)
        );

        CREATE TABLE IF NOT EXISTS history_period (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          start_year INTEGER NOT NULL,
          end_year INTEGER,
          summary TEXT NOT NULL,
          sort INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS history_event (
          id TEXT PRIMARY KEY,
          period_id TEXT NOT NULL REFERENCES history_period(id),
          title TEXT NOT NULL,
          year INTEGER NOT NULL,
          date_display TEXT,
          summary TEXT NOT NULL,
          details TEXT,
          source_id TEXT REFERENCES source(id),
          sort INTEGER NOT NULL
        );
      `);

      // FTS5 Virtual Table for Proposal search
      try {
        await db.exec(`
          CREATE VIRTUAL TABLE IF NOT EXISTS proposal_fts USING fts5(
            proposal_id UNINDEXED,
            summary
          );
        `);
      } catch (err) {
        console.warn("[contentMigrations] Note: FTS5 not available in this sqlite runtime, skipping proposal_fts", err);
      }
    },
  },
];
