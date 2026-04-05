import { describe, it, expect } from "vitest";
import {
  AGGRESSOR_THRESHOLD_MS,
  buildAggressorPayload,
  shouldEscalateChallenge,
} from "../services/pushAggressor";
import { ChallengeStatus, NotificationPriority } from "../generated/prisma/client";

describe("Push Aggressor – shouldEscalateChallenge", () => {
  it("flags pending challenges older than the threshold", () => {
    const now = new Date();
    const stale = new Date(now.getTime() - AGGRESSOR_THRESHOLD_MS - 1_000);
    const fresh = new Date(now.getTime() - AGGRESSOR_THRESHOLD_MS + 10_000);

    expect(
      shouldEscalateChallenge(
        { status: ChallengeStatus.PENDING, createdAt: stale, escalatedAt: null },
        now
      )
    ).toBe(true);

    expect(
      shouldEscalateChallenge(
        { status: ChallengeStatus.PENDING, createdAt: fresh, escalatedAt: null },
        now
      )
    ).toBe(false);
  });

  it("does not escalate already escalated challenges", () => {
    const now = new Date();
    const stale = new Date(now.getTime() - AGGRESSOR_THRESHOLD_MS - 1_000);

    expect(
      shouldEscalateChallenge(
        { status: ChallengeStatus.ESCALATED, createdAt: stale, escalatedAt: now },
        now
      )
    ).toBe(false);
  });

  it("does not escalate satisfied challenges", () => {
    const now = new Date();
    const stale = new Date(now.getTime() - AGGRESSOR_THRESHOLD_MS - 1_000);

    expect(
      shouldEscalateChallenge(
        { status: ChallengeStatus.SATISFIED, createdAt: stale, escalatedAt: null },
        now
      )
    ).toBe(false);
  });
});

describe("Push Aggressor – buildAggressorPayload", () => {
  it("builds Quantchat warning payload with Quantads target", () => {
    const payload = buildAggressorPayload({
      userId: "user-123",
      challengeId: "challenge-abc",
      quantadsTarget: "quantads://campaign/test",
      tokens: ["token-1", "token-2"],
    });

    expect(payload.title).toBe("Quantchat SDK Warning");
    expect(payload.body).toContain("liveness");
    expect(payload.tokens).toEqual(["token-1", "token-2"]);
    expect(payload.priority).toBe(NotificationPriority.HIGH);
    expect(payload.channel).toBe("quantchat-warning");
    expect(payload.data).toHaveProperty("quantadsTarget", "quantads://campaign/test");
    expect(payload.data).toHaveProperty("challengeId", "challenge-abc");
  });

  it("uses default quantads target when not provided", () => {
    const payload = buildAggressorPayload({
      userId: "user-456",
      challengeId: "challenge-def",
      tokens: ["token-3"],
    });

    expect(payload.data).toHaveProperty(
      "quantadsTarget",
      "quantads://campaign/identity-check"
    );
  });

  it("allows custom title and body", () => {
    const payload = buildAggressorPayload({
      userId: "user-789",
      challengeId: "challenge-ghi",
      tokens: ["token-4"],
      title: "Custom Title",
      body: "Custom Body",
    });

    expect(payload.title).toBe("Custom Title");
    expect(payload.body).toBe("Custom Body");
  });
});
