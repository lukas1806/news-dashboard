import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BriefingSnapshot } from "@/types/briefing";

const mocks = vi.hoisted(() => ({
  fetchArticleCandidatesByCategory: vi.fn(),
  generateBriefingSnapshot: vi.fn(),
  loadBriefingSnapshot: vi.fn(),
  saveBriefingSnapshot: vi.fn(),
}));

vi.mock("@/lib/rss", () => ({
  fetchArticleCandidatesByCategory: mocks.fetchArticleCandidatesByCategory,
}));

vi.mock("@/lib/briefing-provider", () => ({
  generateBriefingSnapshot: mocks.generateBriefingSnapshot,
}));

vi.mock("@/lib/briefing-storage", () => ({
  loadBriefingSnapshot: mocks.loadBriefingSnapshot,
  saveBriefingSnapshot: mocks.saveBriefingSnapshot,
}));

import { generateAndSaveDailyBriefing } from "@/lib/briefing-generation";

function createSnapshot(generatedAt: string): BriefingSnapshot {
  return {
    version: 1,
    generatedAt,
    model: "test-model",
    categories: { wirtschaft: [], politik: [], handball: [] },
  };
}

describe("generateAndSaveDailyBriefing operational safeguards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchArticleCandidatesByCategory.mockResolvedValue([]);
  });

  it("reuses today's snapshot without fetching, generating, or saving", async () => {
    const today = new Date().toISOString();
    const existing = createSnapshot(today);
    mocks.loadBriefingSnapshot.mockResolvedValue(existing);

    await expect(generateAndSaveDailyBriefing()).resolves.toEqual({ snapshot: existing, generated: false });
    expect(mocks.fetchArticleCandidatesByCategory).not.toHaveBeenCalled();
    expect(mocks.generateBriefingSnapshot).not.toHaveBeenCalled();
    expect(mocks.saveBriefingSnapshot).not.toHaveBeenCalled();
  });

  it("does not overwrite storage when generation fails", async () => {
    mocks.loadBriefingSnapshot.mockResolvedValue(null);
    mocks.generateBriefingSnapshot.mockRejectedValue(new Error("provider failed"));

    await expect(generateAndSaveDailyBriefing()).rejects.toThrow("provider failed");
    expect(mocks.fetchArticleCandidatesByCategory).toHaveBeenCalledTimes(3);
    expect(mocks.saveBriefingSnapshot).not.toHaveBeenCalled();
  });

  it("saves exactly once after successful generation", async () => {
    const generated = createSnapshot("2026-06-28T03:00:00.000Z");
    mocks.loadBriefingSnapshot.mockResolvedValue(null);
    mocks.generateBriefingSnapshot.mockResolvedValue(generated);

    await expect(generateAndSaveDailyBriefing()).resolves.toEqual({ snapshot: generated, generated: true });
    expect(mocks.saveBriefingSnapshot).toHaveBeenCalledOnce();
    expect(mocks.saveBriefingSnapshot).toHaveBeenCalledWith(generated);
  });
});
