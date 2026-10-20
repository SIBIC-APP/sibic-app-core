import { openDatabase } from "./adapter";
import { DatabaseAdapter } from "./adapter/types";
import { contentMigrations } from "./content/migrations";
import { userMigrations } from "./user/migrations";
import { runMigrations } from "./migrator";

let contentDbInstance: DatabaseAdapter | null = null;
let userDbInstance: DatabaseAdapter | null = null;

export async function getContentDatabase(): Promise<DatabaseAdapter> {
  if (!contentDbInstance) {
    contentDbInstance = await openDatabase("content.db");
    await runMigrations(contentDbInstance, contentMigrations, "content.db");
  }
  return contentDbInstance;
}

export async function getUserDatabase(): Promise<DatabaseAdapter> {
  if (!userDbInstance) {
    userDbInstance = await openDatabase("user.db");
    await runMigrations(userDbInstance, userMigrations, "user.db");
  }
  return userDbInstance;
}

export async function initDatabases(): Promise<{
  contentDb: DatabaseAdapter;
  userDb: DatabaseAdapter;
}> {
  const [contentDb, userDb] = await Promise.all([
    getContentDatabase(),
    getUserDatabase(),
  ]);
  return { contentDb, userDb };
}

// Reset instances (useful for testing or cache cleanup)
export async function closeDatabases(): Promise<void> {
  if (contentDbInstance) {
    await contentDbInstance.close();
    contentDbInstance = null;
  }
  if (userDbInstance) {
    await userDbInstance.close();
    userDbInstance = null;
  }
}

export * from "./adapter/types";
export * from "./migrator";
export { contentMigrations } from "./content/migrations";
export { userMigrations } from "./user/migrations";
