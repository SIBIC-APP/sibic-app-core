import { Migration } from "../migrator";

export const userMigrations: Migration[] = [
  {
    version: 1,
    name: "001_initial_user_schema",
    up: async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS progress (
          lesson_id TEXT PRIMARY KEY,
          completed_at TEXT NOT NULL,
          xp INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS unlocked_cat (
          cat_id TEXT PRIMARY KEY,
          unlocked_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS saved_item (
          kind TEXT NOT NULL,
          item_id TEXT NOT NULL,
          saved_at TEXT NOT NULL,
          PRIMARY KEY (kind, item_id)
        );

        -- Solo local. Nunca se sincroniza a ningun servidor externo.
        CREATE TABLE IF NOT EXISTS brujula_result (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          taken_at TEXT NOT NULL,
          answers TEXT NOT NULL,
          scores TEXT NOT NULL
        );
      `);
    },
  },
];
