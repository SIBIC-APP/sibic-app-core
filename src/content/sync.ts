import { HistoryPack } from "@content-schema";
import { DatabaseAdapter } from "../db/adapter/types";
import { applyPack } from "./applier";
import { calculateSha256 } from "./hasher";
import { fetchManifest, filterPacksToUpdate, getLocalPacks } from "./manifest";
import { isAppOutdated } from "./semver";
import { SyncOptions, SyncResult } from "./types";

export async function syncContent(
  db: DatabaseAdapter,
  options: SyncOptions
): Promise<SyncResult> {
  const { manifestUrl, currentAppVersion, timeoutMs = 5000, fetchFn = fetch } = options;
  const appliedPacks: string[] = [];
  const skippedPacks: string[] = [];
  const errors: string[] = [];

  // 1. Fetch manifest
  let manifest;
  try {
    manifest = await fetchManifest(manifestUrl, timeoutMs, fetchFn);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      status: "error",
      appliedPacks,
      skippedPacks,
      errors: [`Error fetching manifest: ${message}`],
    };
  }

  // 2. Validate minAppVersion
  if (isAppOutdated(currentAppVersion, manifest.minAppVersion)) {
    return {
      success: false,
      status: "app_update_required",
      appliedPacks,
      skippedPacks,
      errors: [
        `App version ${currentAppVersion} is below required minimum ${manifest.minAppVersion}. Please update the app.`,
      ],
      manifest,
      updateRequired: true,
    };
  }

  // 3. Compare with local applied packs
  const localPacks = await getLocalPacks(db);
  const packsToUpdate = filterPacksToUpdate(manifest, localPacks);

  if (packsToUpdate.length === 0) {
    return {
      success: true,
      status: "up_to_date",
      appliedPacks,
      skippedPacks: Array.from(localPacks.keys()),
      errors,
      manifest,
    };
  }

  // 4. Download and apply each outdated pack
  for (const packRef of packsToUpdate) {
    try {
      // Resolve URL (relative to manifest or absolute)
      const packUrl = packRef.url.startsWith("http")
        ? packRef.url
        : new URL(packRef.url, manifestUrl).toString();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetchFn(packUrl, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} downloading pack "${packRef.id}"`);
      }

      const rawText = await response.text();

      // Check SHA-256
      const calculatedHash = await calculateSha256(rawText);
      if (calculatedHash !== packRef.sha256) {
        throw new Error(
          `Checksum mismatch for pack "${packRef.id}". Expected: ${packRef.sha256}, got: ${calculatedHash}`
        );
      }

      // Parse JSON
      const json = JSON.parse(rawText);

      // Validate schema according to domain
      let validatedData: unknown;
      if (packRef.id === "historia") {
        const parsed = HistoryPack.safeParse(json);
        if (!parsed.success) {
          throw new Error(
            `Schema validation failed for pack "historia": ${parsed.error.issues.map((i) => i.message).join(", ")}`
          );
        }
        validatedData = parsed.data;
      } else {
        throw new Error(`Unknown pack domain: "${packRef.id}"`);
      }

      // Apply in SQLite transaction with automatic rollback on error
      await applyPack(db, {
        packId: packRef.id,
        version: packRef.version,
        sha256: packRef.sha256,
        data: validatedData,
      });

      appliedPacks.push(packRef.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to apply pack "${packRef.id}": ${message}`);
      skippedPacks.push(packRef.id);
    }
  }

  const success = errors.length === 0;
  return {
    success,
    status: success ? "up_to_date" : "error",
    appliedPacks,
    skippedPacks,
    errors,
    manifest,
  };
}
