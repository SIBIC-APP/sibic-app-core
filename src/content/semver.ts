/**
 * Compares two semantic version strings (e.g. "1.0.0", "1.2.3").
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/, "").trim();
  const parts1 = clean(v1).split(".").map((n) => parseInt(n, 10) || 0);
  const parts2 = clean(v2).split(".").map((n) => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function isAppOutdated(currentAppVersion: string, minAppVersion: string): boolean {
  return compareSemver(currentAppVersion, minAppVersion) < 0;
}
