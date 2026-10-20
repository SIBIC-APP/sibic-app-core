export interface RunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface DatabaseAdapter {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: unknown[]): Promise<RunResult>;
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirst<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(cb: (tx: DatabaseAdapter) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export type DbName = "content.db" | "user.db";
