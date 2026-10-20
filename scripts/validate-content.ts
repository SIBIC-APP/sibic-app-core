import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { Manifest, HistoryPack } from "../packages/content-schema/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export function validateAllContent(contentDir: string = path.resolve(__dirname, "../content")): boolean {
  console.log(`[validate-content] Validating content directory: ${contentDir}`);

  const manifestPath = path.join(contentDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`manifest.json not found in ${contentDir}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, "utf8");
  const manifest = Manifest.parse(JSON.parse(manifestRaw));
  console.log(`[validate-content] Manifest is valid (version ${manifest.schemaVersion}, minApp: ${manifest.minAppVersion})`);

  for (const packRef of manifest.packs) {
    const packFileName = path.basename(packRef.url);
    const packFilePath = path.join(contentDir, packFileName);

    if (!fs.existsSync(packFilePath)) {
      throw new Error(`Pack file "${packFileName}" declared in manifest does not exist at ${packFilePath}`);
    }

    const rawContent = fs.readFileSync(packFilePath, "utf8");
    const actualBytes = Buffer.byteLength(rawContent, "utf8");
    const actualSha = crypto.createHash("sha256").update(rawContent).digest("hex");

    if (actualBytes !== packRef.bytes) {
      throw new Error(
        `Pack "${packRef.id}" byte size mismatch. Declared: ${packRef.bytes}, Actual: ${actualBytes}`
      );
    }

    if (actualSha !== packRef.sha256) {
      throw new Error(
        `Pack "${packRef.id}" SHA-256 mismatch. Declared: ${packRef.sha256}, Actual: ${actualSha}`
      );
    }

    const json = JSON.parse(rawContent);

    if (packRef.id === "historia") {
      const parsed = HistoryPack.parse(json);
      console.log(
        `[validate-content] Pack "${packRef.id}" v${parsed.version} valid (${parsed.periods.length} periods, ${parsed.events.length} events, ${parsed.sources.length} sources)`
      );

      // Verify that every event has an existing source or period
      const sourceIds = new Set(parsed.sources.map((s) => s.id));
      const periodIds = new Set(parsed.periods.map((p) => p.id));

      for (const ev of parsed.events) {
        if (!periodIds.has(ev.periodId)) {
          throw new Error(`Event "${ev.id}" references non-existent periodId "${ev.periodId}"`);
        }
        if (ev.sourceId && !sourceIds.has(ev.sourceId)) {
          throw new Error(`Event "${ev.id}" references non-existent sourceId "${ev.sourceId}"`);
        }
      }
    }
  }

  console.log("[validate-content] All content packs and manifest validated successfully! ✅");
  return true;
}

if (process.argv[1]?.endsWith("validate-content.ts")) {
  try {
    validateAllContent();
    process.exit(0);
  } catch (err) {
    console.error("[validate-content] Error:", err);
    process.exit(1);
  }
}
