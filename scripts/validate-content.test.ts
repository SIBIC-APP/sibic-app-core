import { describe, it, expect } from "vitest";
import { validateAllContent } from "./validate-content";

describe("Content Validation Script", () => {
  it("successfully validates all production content packs against manifest and Zod schemas", () => {
    expect(() => validateAllContent()).not.toThrow();
  });
});
