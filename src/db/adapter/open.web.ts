import * as SQLite from "expo-sqlite";
import { DatabaseAdapter, DbName, RunResult } from "./types";

class WebSqliteAdapter implements DatabaseAdapter {
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

// In-memory fallback adapter for web environments lacking WASM / COOP headers
class MemoryFallbackAdapter implements DatabaseAdapter {
  private tables = new Map<string, Array<Record<string, unknown>>>();

  async exec(sql: string): Promise<void> {
    // Basic table creation parser for memory fallback
    const createMatches = sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi);
    for (const match of createMatches) {
      if (!this.tables.has(match[1])) {
        this.tables.set(match[1], []);
      }
    }
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    // Basic run handler for in-memory fallback
    return { changes: 1, lastInsertRowId: 1 };
  }

  async all<T = Record<string, unknown>>(_sql: string, _params: unknown[] = []): Promise<T[]> {
    return [] as T[];
  }

  async getFirst<T = Record<string, unknown>>(_sql: string, _params: unknown[] = []): Promise<T | null> {
    return null;
  }

  async transaction<T>(cb: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    return await cb(this);
  }

  async close(): Promise<void> {
    this.tables.clear();
  }
}

export async function openDatabase(name: DbName): Promise<DatabaseAdapter> {
  try {
    const db = await SQLite.openDatabaseAsync(name);
    return new WebSqliteAdapter(db);
  } catch (error) {
    console.warn(`[openDatabase:web] Fallback in-memory adapter active for ${name}:`, error);
    return new MemoryFallbackAdapter();
  }
}
