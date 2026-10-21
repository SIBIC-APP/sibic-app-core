import * as Crypto from "expo-crypto";

export async function calculateSha256(content: string): Promise<string> {
  // si expo crypto tiene digeststringasync en movil o simulado
  if (Crypto.digestStringAsync) {
    try {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        content
      );
    } catch {
      // respaldo con web crypto estandar
    }
  }

  // api de web crypto compatible con node 18 y navegadores modernos
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // respaldo con el modulo crypto de node si esta disponible
  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(content).digest("hex");
  } catch (err) {
    throw new Error(`[calculateSha256] No cryptographic provider available: ${err}`);
  }
}
