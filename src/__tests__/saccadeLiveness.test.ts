import { describe, it, expect, vi } from "vitest";
import {
  validateSaccadeLiveness,
  type SaccadeSample,
} from "../services/saccadeLivenessService";

function recentTimestamp(offsetMs = 0): number {
  return Date.now() - offsetMs;
}

describe("validateSaccadeLiveness", () => {
  it("should fail with no samples", () => {
    const result = validateSaccadeLiveness([]);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("NO_SACCADE_DATA");
    expect(result.sampleCount).toBe(0);
  });

  it("should fail with too few samples", () => {
    const samples: SaccadeSample[] = [
      { dx: 1, dy: 2, timestamp: recentTimestamp(100) },
      { dx: 3, dy: 4, timestamp: recentTimestamp(200) },
    ];
    const result = validateSaccadeLiveness(samples);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("INSUFFICIENT_SACCADE_SAMPLES");
  });

  it("should fail with low entropy (all same movement)", () => {
    const samples: SaccadeSample[] = Array.from({ length: 10 }, (_, i) => ({
      dx: 5,
      dy: 5,
      timestamp: recentTimestamp(i * 100),
    }));
    const result = validateSaccadeLiveness(samples);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("LOW_SACCADE_ENTROPY");
  });

  it("should pass with high entropy diverse movements", () => {
    const samples: SaccadeSample[] = Array.from({ length: 100 }, (_, i) => ({
      dx: i * 10 + Math.random() * 50,
      dy: i * 10 + Math.random() * 50,
      timestamp: recentTimestamp(i * 100),
    }));
    const result = validateSaccadeLiveness(samples);
    expect(result.passed).toBe(true);
    expect(result.reason).toBe("HUMAN_VERIFIED");
    expect(result.saccadeHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should ignore samples outside the 30-second window", () => {
    const oldSamples: SaccadeSample[] = Array.from(
      { length: 100 },
      (_, i) => ({
        dx: i * 10,
        dy: i * 10,
        timestamp: Date.now() - 60_000 - i * 100, // 60+ seconds ago
      })
    );
    const result = validateSaccadeLiveness(oldSamples);
    expect(result.passed).toBe(false);
    expect(result.reason).toBe("NO_SACCADE_DATA");
  });

  it("should produce a deterministic saccade hash", () => {
    // Use fixed timestamps to ensure determinism
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:30.000Z"));

    const samples: SaccadeSample[] = Array.from({ length: 100 }, (_, i) => ({
      dx: i * 10,
      dy: i * 10,
      timestamp: new Date("2025-01-01T00:00:00.000Z").getTime() + i * 100,
    }));
    const a = validateSaccadeLiveness(samples);
    const b = validateSaccadeLiveness(samples);
    expect(a.saccadeHash).toBe(b.saccadeHash);

    vi.useRealTimers();
  });
});
