import { Manifest, ManifestType, PackRefType } from "@content-schema";
import { DatabaseAdapter } from "../db/adapter/types";
import { AppliedPackRow } from "./types";

export async function fetchManifest(
  url: string,
  timeoutMs = 5000,
  fetchFn: typeof fetch = fetch
): Promise<ManifestType> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchFn(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch manifest: HTTP ${res.status} (${res.statusText})`);
    }

    const data = await res.json();
    const parsed = Manifest.safeParse(data);

    if (!parsed.success) {
      throw new Error(
        `Invalid manifest schema: ${parsed.error.issues.map((i) => i.message).join(", ")}`
      );
    }

    return parsed.data;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getLocalPacks(
  db: DatabaseAdapter
): Promise<Map<string, { version: number; sha256: string }>> {
  const rows = await db.all<AppliedPackRow>(
    "SELECT id, version, sha256 FROM applied_pack;"
  );
  const map = new Map<string, { version: number; sha256: string }>();
  for (const row of rows) {
    map.set(row.id, { version: row.version, sha256: row.sha256 });
  }
  return map;
}

export function filterPacksToUpdate(
  manifest: ManifestType,
  localPacks: Map<string, { version: number; sha256: string }>
): PackRefType[] {
  return manifest.packs.filter((pack) => {
    const local = localPacks.get(pack.id);
    if (!local) return true; // not installed yet
    return pack.version > local.version || pack.sha256 !== local.sha256;
  });
}
