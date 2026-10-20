import { DatabaseAdapter } from "../db/adapter/types";
import { applyPack } from "./applier";
import historiaSeed from "./seeds/historia.v1.json";

export async function ensureEmbeddedSeeds(db: DatabaseAdapter): Promise<boolean> {
  const row = await db.getFirst<{ count: number }>(
    "SELECT count(*) as count FROM applied_pack WHERE id = 'historia';"
  );

  if ((row?.count ?? 0) === 0) {
    await applyPack(db, {
      packId: "historia",
      version: historiaSeed.version,
      sha256: "embedded-seed-v1",
      data: historiaSeed,
    });
    return true;
  }
  return false;
}
