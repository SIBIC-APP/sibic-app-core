import { SupabaseClient } from "@supabase/supabase-js";
import { DatabaseAdapter } from "@/db/adapter/types";
import { mergeProgressSnapshots } from "./merge";
import { ProgressSnapshot, SavedItemRecord } from "./types";

export class AccountSyncService {
  /**
   * lee la instantanea local actual desde user db
   * nota: unicamente lee progress, unlocked cat y saved item
   * mi brujula se excluye intencionalmente por privacidad
   */
  static async readLocalSnapshot(userDb: DatabaseAdapter): Promise<ProgressSnapshot> {
    const progressRows = await userDb.all<{ lesson_id: string; xp: number }>(
      "SELECT lesson_id, xp FROM progress;"
    );
    const catRows = await userDb.all<{ cat_id: string }>(
      "SELECT cat_id FROM unlocked_cat;"
    );
    const savedRows = await userDb.all<{ kind: string; item_id: string; saved_at: string }>(
      "SELECT kind, item_id, saved_at FROM saved_item;"
    );

    const totalXp = progressRows.reduce((sum, r) => sum + r.xp, 0);
    const completedLessons = progressRows.map((r) => r.lesson_id);
    const unlockedCats = catRows.map((r) => r.cat_id);
    const savedItems: SavedItemRecord[] = savedRows.map((r) => ({
      kind: r.kind,
      itemId: r.item_id,
      savedAt: r.saved_at,
    }));

    return {
      totalXp,
      completedLessons,
      unlockedCats,
      savedItems,
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * escribe una instantanea fusionada en user db local dentro de una transaccion atomica
   */
  static async writeMergedSnapshot(
    userDb: DatabaseAdapter,
    merged: ProgressSnapshot
  ): Promise<void> {
    await userDb.transaction(async (tx) => {
      const now = new Date().toISOString();

      // actualizar o insertar lecciones completadas
      for (const lessonId of merged.completedLessons) {
        const existing = await tx.getFirst<{ lesson_id: string }>(
          "SELECT lesson_id FROM progress WHERE lesson_id = ?;",
          [lessonId]
        );
        if (!existing) {
          await tx.run(
            "INSERT INTO progress (lesson_id, completed_at, xp) VALUES (?, ?, ?);",
            [lessonId, now, 50] // recompensa base por defecto
          );
        }
      }

      // actualizar o insertar gatos desbloqueados
      for (const catId of merged.unlockedCats) {
        const existing = await tx.getFirst<{ cat_id: string }>(
          "SELECT cat_id FROM unlocked_cat WHERE cat_id = ?;",
          [catId]
        );
        if (!existing) {
          await tx.run(
            "INSERT INTO unlocked_cat (cat_id, unlocked_at) VALUES (?, ?);",
            [catId, now]
          );
        }
      }

      // actualizar o insertar elementos guardados
      for (const item of merged.savedItems) {
        await tx.run(
          `INSERT OR REPLACE INTO saved_item (kind, item_id, saved_at)
           VALUES (?, ?, ?);`,
          [item.kind, item.itemId, item.savedAt]
        );
      }
    });
  }

  /**
   * sincroniza el progreso local con supabase
   * algoritmo: maximo de xp y union de lecciones, gatos y elementos guardados
   */
  static async syncWithSupabase(
    client: SupabaseClient,
    userDb: DatabaseAdapter,
    userId: string
  ): Promise<{ success: boolean; snapshot: ProgressSnapshot; error?: string }> {
    try {
      const local = await this.readLocalSnapshot(userDb);

      // 1. obtener instantanea remota
      const { data: remoteData, error: fetchError } = await client
        .from("progress_snapshots")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Failed to fetch cloud snapshot: ${fetchError.message}`);
      }

      let mergedSnapshot: ProgressSnapshot;

      if (!remoteData) {
        // no existe instantanea remota todavia: subir estado local inicial
        mergedSnapshot = local;
        const { error: insertError } = await client
          .from("progress_snapshots")
          .insert({
            user_id: userId,
            total_xp: local.totalXp,
            completed_lessons: local.completedLessons,
            unlocked_cats: local.unlockedCats,
            saved_items: local.savedItems,
            synced_at: local.syncedAt,
          });

        if (insertError) {
          throw new Error(`Failed to upload initial snapshot: ${insertError.message}`);
        }
      } else {
        // existe instantanea remota: ejecutar union matematica de conjuntos
        const remoteSnapshot: ProgressSnapshot = {
          totalXp: remoteData.total_xp,
          completedLessons: remoteData.completed_lessons ?? [],
          unlockedCats: remoteData.unlocked_cats ?? [],
          savedItems: remoteData.saved_items ?? [],
          syncedAt: remoteData.synced_at,
        };

        mergedSnapshot = mergeProgressSnapshots(local, remoteSnapshot);

        // actualizar servidor remoto con instantanea fusionada
        const { error: updateError } = await client
          .from("progress_snapshots")
          .update({
            total_xp: mergedSnapshot.totalXp,
            completed_lessons: mergedSnapshot.completedLessons,
            unlocked_cats: mergedSnapshot.unlockedCats,
            saved_items: mergedSnapshot.savedItems,
            synced_at: mergedSnapshot.syncedAt,
          })
          .eq("user_id", userId);

        if (updateError) {
          throw new Error(`Failed to update cloud snapshot: ${updateError.message}`);
        }

        // aplicar instantanea fusionada de vuelta en user db local
        await this.writeMergedSnapshot(userDb, mergedSnapshot);
      }

      return { success: true, snapshot: mergedSnapshot };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        snapshot: await this.readLocalSnapshot(userDb),
        error: message,
      };
    }
  }

  /**
   * elimina la cuenta de usuario y todos los registros remotos
   */
  static async deleteAccount(
    client: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await client.rpc("delete_user_account");
      if (error) {
        throw new Error(error.message);
      }
      await client.auth.signOut();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  }
}
