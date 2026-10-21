import Database from "better-sqlite3";
import { DatabaseAdapter, DbName, RunResult } from "./types";

export class NodeSqliteAdapter implements DatabaseAdapter {
  private db: Database.Database;

  constructor(filePathOrMemory: string = ":memory:") {
    this.db = new Database(filePathOrMemory);
  }

  async exec(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async run(sql: string, params: unknown[] = []): Promise<RunResult> {
    const stmt = this.db.prepare(sql);
    const info = stmt.run(...params);
    return {
      changes: info.changes,
      lastInsertRowId: Number(info.lastInsertRowid),
    };
  }

  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as T[];
  }

  async getFirst<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(...params);
    return (row as T) ?? null;
  }

  async transaction<T>(cb: (tx: DatabaseAdapter) => Promise<T>): Promise<T> {
    // en better sqlite3 las transacciones se ejecutan con begin y commit
    this.db.exec("BEGIN");
    try {
      const res = await cb(this);
      this.db.exec("COMMIT");
      return res;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  async close(): Promise<void> {
    this.db.close();
  }
}

export async function openNodeDatabase(nameOrPath: DbName | string = ":memory:"): Promise<DatabaseAdapter> {
  return new NodeSqliteAdapter(nameOrPath);
}
