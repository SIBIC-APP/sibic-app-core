import { describe, it, expect, beforeEach } from "vitest";
import { openNodeDatabase } from "../db/adapter/node";
import { DatabaseAdapter } from "../db/adapter/types";
import { contentMigrations } from "../db/content/migrations";
import { runMigrations } from "../db/migrator";
import { syncContent } from "./sync";
import { calculateSha256 } from "./hasher";

describe("Content Sync Engine", () => {
  let db: DatabaseAdapter;

  const sampleHistoryPack = {
    packId: "historia",
    version: 1,
    sources: [
      {
        id: "src-1",
        title: "Constitución 1985",
        url: "https://www.congreso.gob.gt",
        retrievedAt: "2026-10-20T00:00:00Z",
      },
    ],
    periods: [
      {
        id: "per-1",
        title: "Período Democrático",
        startYear: 1985,
        summary: "Inicio de la era democrática moderna.",
        sort: 1,
      },
    ],
    events: [
      {
        id: "ev-1",
        periodId: "per-1",
        title: "Creación del TSE",
        year: 1985,
        summary: "Se funda el Tribunal Supremo Electoral.",
        sourceId: "src-1",
        sort: 1,
      },
    ],
  };

  beforeEach(async () => {
    db = await openNodeDatabase(":memory:");
    await runMigrations(db, contentMigrations, "content.db");
  });

  it("applies a pack successfully when manifest and hash are valid", async () => {
    const rawText = JSON.stringify(sampleHistoryPack);
    const sha256 = await calculateSha256(rawText);

    const manifest = {
      schemaVersion: 1,
      minAppVersion: "1.0.0",
      generatedAt: "2026-10-20T00:00:00Z",
      packs: [
        {
          id: "historia",
          version: 1,
          url: "https://cdn.sibic.gt/historia.v1.json",
          sha256,
          bytes: Buffer.byteLength(rawText),
        },
      ],
    };

    const mockFetch = (async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("manifest.json")) {
        return new Response(JSON.stringify(manifest), { status: 200 });
      }
      if (urlStr.includes("historia.v1.json")) {
        return new Response(rawText, { status: 200 });
      }
      return new Response("Not found", { status: 404 });
    }) as typeof fetch;

    const result = await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFetch,
    });

    expect(result.success).toBe(true);
    expect(result.appliedPacks).toContain("historia");

    // Verify DB insertion
    const periods = await db.all("SELECT * FROM history_period;");
    expect(periods).toHaveLength(1);
    expect(periods[0].title).toBe("Período Democrático");

    const applied = await db.getFirst<{ version: number }>(
      "SELECT version FROM applied_pack WHERE id = 'historia';"
    );
    expect(applied?.version).toBe(1);
  });

  it("rejects a pack and does not apply data if SHA-256 hash is mismatched", async () => {
    const rawText = JSON.stringify(sampleHistoryPack);

    const manifest = {
      schemaVersion: 1,
      minAppVersion: "1.0.0",
      generatedAt: "2026-10-20T00:00:00Z",
      packs: [
        {
          id: "historia",
          version: 1,
          url: "https://cdn.sibic.gt/historia.v1.json",
          sha256: "0000000000000000000000000000000000000000000000000000000000000000", // Tampered hash
          bytes: Buffer.byteLength(rawText),
        },
      ],
    };

    const mockFetch = (async (url: string | URL | Request) => {
      if (url.toString().includes("manifest.json")) {
        return new Response(JSON.stringify(manifest), { status: 200 });
      }
      return new Response(rawText, { status: 200 });
    }) as typeof fetch;

    const result = await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFetch,
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Checksum mismatch");

    // DB should remain empty
    const periods = await db.all("SELECT * FROM history_period;");
    expect(periods).toHaveLength(0);
  });

  it("rolls back atomically and keeps previous data if pack schema is invalid", async () => {
    // First, populate valid v1 data
    const rawTextV1 = JSON.stringify(sampleHistoryPack);
    const hashV1 = await calculateSha256(rawTextV1);
    const manifestV1 = {
      schemaVersion: 1,
      minAppVersion: "1.0.0",
      generatedAt: "2026-10-20T00:00:00Z",
      packs: [
        {
          id: "historia",
          version: 1,
          url: "https://cdn.sibic.gt/historia.v1.json",
          sha256: hashV1,
          bytes: Buffer.byteLength(rawTextV1),
        },
      ],
    };

    const mockFetchV1 = (async (url: string | URL | Request) => {
      if (url.toString().includes("manifest.json")) {
        return new Response(JSON.stringify(manifestV1), { status: 200 });
      }
      return new Response(rawTextV1, { status: 200 });
    }) as typeof fetch;

    await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFetchV1,
    });

    // Now try to sync corrupted v2 pack (missing required fields in schema)
    const corruptedPack = {
      packId: "historia",
      version: 2,
      periods: [{ invalidField: 123 }], // Fails Zod HistoryPack schema
    };
    const rawTextV2 = JSON.stringify(corruptedPack);
    const hashV2 = await calculateSha256(rawTextV2);
    const manifestV2 = {
      schemaVersion: 1,
      minAppVersion: "1.0.0",
      generatedAt: "2026-10-20T01:00:00Z",
      packs: [
        {
          id: "historia",
          version: 2,
          url: "https://cdn.sibic.gt/historia.v2.json",
          sha256: hashV2,
          bytes: Buffer.byteLength(rawTextV2),
        },
      ],
    };

    const mockFetchV2 = (async (url: string | URL | Request) => {
      if (url.toString().includes("manifest.json")) {
        return new Response(JSON.stringify(manifestV2), { status: 200 });
      }
      return new Response(rawTextV2, { status: 200 });
    }) as typeof fetch;

    const result = await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFetchV2,
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("Schema validation failed");

    // Previous v1 data must remain completely intact!
    const periods = await db.all("SELECT * FROM history_period;");
    expect(periods).toHaveLength(1);
    expect(periods[0].title).toBe("Período Democrático");

    const applied = await db.getFirst<{ version: number }>(
      "SELECT version FROM applied_pack WHERE id = 'historia';"
    );
    expect(applied?.version).toBe(1);
  });

  it("halts and requests app update when minAppVersion > currentAppVersion", async () => {
    const manifest = {
      schemaVersion: 1,
      minAppVersion: "2.0.0", // Greater than installed "1.0.0"
      generatedAt: "2026-10-20T00:00:00Z",
      packs: [],
    };

    const mockFetch = (async () => {
      return new Response(JSON.stringify(manifest), { status: 200 });
    }) as typeof fetch;

    const result = await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFetch,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("app_update_required");
    expect(result.updateRequired).toBe(true);
    expect(result.errors[0]).toContain("Please update the app");
  });

  it("handles network failure cleanly without corrupting the local database", async () => {
    const mockFailingFetch = (async () => {
      throw new Error("Network request failed: unreachable host");
    }) as typeof fetch;

    const result = await syncContent(db, {
      manifestUrl: "https://cdn.sibic.gt/manifest.json",
      currentAppVersion: "1.0.0",
      fetchFn: mockFailingFetch,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("error");
    expect(result.errors[0]).toContain("Error fetching manifest");
  });
});
