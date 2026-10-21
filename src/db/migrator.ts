import { DatabaseAdapter } from "./adapter/types";

export interface Migration {
  version: number;
  name: string;
  up: (db: DatabaseAdapter) => Promise<void>;
}

export async function runMigrations(
  db: DatabaseAdapter,
  migrations: Migration[],
  dbLabel: string
): Promise<number> {
  // leer version actual
  const versionRow = await db.getFirst<{ user_version: number }>("PRAGMA user_version;");
  const currentVersion = versionRow?.user_version ?? 0;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    return currentVersion;
  }

  for (const migration of pending) {
    await db.transaction(async (tx) => {
      await migration.up(tx);
      await tx.exec(`PRAGMA user_version = ${migration.version};`);
    });
  }

  const updatedVersionRow = await db.getFirst<{ user_version: number }>("PRAGMA user_version;");
  return updatedVersionRow?.user_version ?? currentVersion;
}
