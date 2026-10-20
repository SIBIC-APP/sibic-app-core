import * as SQLite from "expo-sqlite";
import { DatabaseAdapter, DbName, RunResult } from "./types";

class ExpoSqliteAdapter implements DatabaseAdapter {
  constructor(private readonly db: SQLite.SQLiteDatabase) {}

  async exec(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const res = await this.db.runAsync(sql, ...(params as SQLite.SQLiteBindValue[]));
    return {
      changes: res.changes,
      lastInsertRowId: res.lastInsertRowId,
    };
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    return await this.db.getAllAsync<T>(sql, ...(params as SQLite.SQLiteBindValue[]));
  }

  async getFirst<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const res = await this.db.getFirstAsync<T>(sql, ...(params as SQLite.SQLiteBindValue[]));
    return res ?? null;
  }

  async transaction<T>(cb: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    let result!: T;
    await this.db.withTransactionAsync(async () => {
      result = await cb(this);
    });
    return result;
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }
}

export async function openDatabase(name: DbName): Promise<DatabaseAdapter> {
  const db = await SQLite.openDatabaseAsync(name);
  return new ExpoSqliteAdapter(db);
}
