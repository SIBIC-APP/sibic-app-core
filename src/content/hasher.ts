import * as Crypto from "expo-crypto";

export async function calculateSha256(content: string): Promise<string> {
  // If expo-crypto has digestStringAsync (mobile or mocked)
  if (Crypto.digestStringAsync) {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content
      );
    } catch {
      // Fallback to standard web crypto
    }
  }

  // Web Crypto API (supported in Node 18+ and modern browsers)
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Node crypto fallback if available
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(content).digest("hex");
  } catch (err) {
    throw new Error(`[calculateSha256] No cryptographic provider available: ${err}`);
  }
}
