import { DatabaseAdapter } from "../db/adapter/types";
import { applyPack } from "./applier";
import historiaSeed from "./seeds/historia.v1.json";
import brujulaSeed from "./seeds/brujula.v1.json";
import aprendeSeed from "./seeds/aprende.v1.json";

export async function ensureEmbeddedSeeds(db: DatabaseAdapter): Promise<string[]> {
  const seeds = [
    { id: "historia", data: historiaSeed },
    { id: "brujula", data: brujulaSeed },
    { id: "aprende", data: aprendeSeed },
  ];

  const applied: string[] = [];

  for (const s of seeds) {
    const row = await db.getFirst<{ count: number }>(
      "SELECT count(*) as count FROM applied_pack WHERE id = ?;",
      [s.id]
    );

    if ((row?.count ?? 0) === 0) {
      await applyPack(db, {
        packId: s.id,
        version: s.data.version,
        sha256: `embedded-${s.id}-v${s.data.version}`,
        data: s.data,
      });
      applied.push(s.id);
    }
  }

  return applied;
}
