import { describe, expect, it } from "vitest";
import { secretsMatch } from "@/lib/request-auth";

describe("secretsMatch", () => {
  it("accepts only an exact configured secret", () => {
    expect(secretsMatch("correct-secret", "correct-secret")).toBe(true);
    expect(secretsMatch("wrong-secret", "correct-secret")).toBe(false);
    expect(secretsMatch("correct-secret-extra", "correct-secret")).toBe(false);
  });

  it("rejects missing values", () => {
    expect(secretsMatch(null, "correct-secret")).toBe(false);
    expect(secretsMatch("correct-secret", undefined)).toBe(false);
  });
});
