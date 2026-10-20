import { describe, it, expect } from "vitest";
import { Manifest, PackRef } from "./index";

describe("Content Schemas", () => {
  it("validates a valid PackRef correctly", () => {
    const validPack = {
      id: "historia",
      version: 1,
      url: "historia.v1.json",
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      bytes: 1024,
    };

    const parsed = PackRef.safeParse(validPack);
    expect(parsed.success).toBe(true);
  });

  it("validates a valid Manifest structure", () => {
    const validManifest = {
      schemaVersion: 1,
      minAppVersion: "1.0.0",
      generatedAt: "2026-10-20T00:00:00Z",
      packs: [
        {
          id: "historia",
          version: 1,
          url: "historia.v1.json",
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          bytes: 1024,
        },
      ],
    };

    const parsed = Manifest.safeParse(validManifest);
    expect(parsed.success).toBe(true);
  });
});
