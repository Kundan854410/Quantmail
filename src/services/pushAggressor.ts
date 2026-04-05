import { prisma } from "../db";
import {
  ChallengeStatus,
  NotificationPriority,
  NotificationStatus,
} from "../generated/prisma/client";

export const AGGRESSOR_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours
export const QUANTADS_DEFAULT_TARGET = "quantads://campaign/identity-check";
const QUANTCHAT_CHANNEL = "quantchat-warning";

export interface AggressorPushPayload {
  title: string;
  body: string;
  tokens: string[];
  data: Record<string, unknown>;
  priority: NotificationPriority;
  channel: string;
}

export function shouldEscalateChallenge(
  challenge: {
    status: ChallengeStatus;
    createdAt: Date;
    escalatedAt: Date | null;
  },
  now: Date = new Date(),
  thresholdMs: number = AGGRESSOR_THRESHOLD_MS
): boolean {
  if (challenge.status !== ChallengeStatus.PENDING) return false;
  if (challenge.escalatedAt) return false;
  return now.getTime() - challenge.createdAt.getTime() >= thresholdMs;
}

export function buildAggressorPayload(options: {
  userId: string;
  challengeId: string;
  quantadsTarget?: string;
  title?: string;
  body?: string;
  tokens: string[];
}): AggressorPushPayload {
  const quantadsTarget = options.quantadsTarget || QUANTADS_DEFAULT_TARGET;
  const title = options.title || "Quantchat SDK Warning";
  const body =
    options.body ||
    "Biometric liveness token ignored. Open to resolve.";

  return {
    title,
    body,
    tokens: options.tokens,
    data: {
      type: "liveness_escalation",
      challengeId: options.challengeId,
      userId: options.userId,
      quantadsTarget,
    },
    priority: NotificationPriority.HIGH,
    channel: QUANTCHAT_CHANNEL,
  };
}

/**
 * Dispatches a push notification payload to the given device tokens.
 * In production, this would call FCM / APNs. Here we log and return true.
 */
export async function dispatchNotification(
  notificationId: string,
  tokens: string[],
  payload: AggressorPushPayload
): Promise<boolean> {
  if (tokens.length === 0) return false;
  console.log(
    `[PushAggressor] dispatch ${notificationId} to ${tokens.length} token(s)`,
    payload.title
  );
  return true;
}

export async function registerDeviceToken(params: {
  userId: string;
  token: string;
  platform: string;
}): Promise<void> {
  const existing = await prisma.deviceToken.findUnique({
    where: { token: params.token },
  });
  if (existing) return;
  await prisma.deviceToken.create({
    data: {
      userId: params.userId,
      token: params.token,
      platform: params.platform,
    },
  });
}

export async function triggerAggressivePush(
  challengeId: string,
  now: Date = new Date()
): Promise<{
  notificationId: string | null;
  dispatched: boolean;
  skipped: boolean;
}> {
  const challenge = await prisma.livenessChallenge.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) {
    return { notificationId: null, dispatched: false, skipped: true };
  }

  if (!shouldEscalateChallenge(challenge, now)) {
    return { notificationId: null, dispatched: false, skipped: true };
  }

  const tokenRecords = await prisma.deviceToken.findMany({
    where: { userId: challenge.userId },
    select: { token: true },
  });

  const tokenValues = tokenRecords.map((t) => t.token);

  if (tokenValues.length === 0) {
    return { notificationId: null, dispatched: false, skipped: true };
  }

  const payload = buildAggressorPayload({
    userId: challenge.userId,
    challengeId: challenge.id,
    quantadsTarget: challenge.quantadsTarget || undefined,
    title: challenge.quantchatTitle,
    body: challenge.quantchatBody,
    tokens: tokenValues,
  });

  const notification = await prisma.pushNotification.create({
    data: {
      userId: challenge.userId,
      challengeId: challenge.id,
      title: payload.title,
      body: payload.body,
      payload: JSON.stringify(payload.data),
      priority: NotificationPriority.HIGH,
      status: NotificationStatus.QUEUED,
      channel: QUANTCHAT_CHANNEL,
    },
  });

  await prisma.livenessChallenge.update({
    where: { id: challenge.id },
    data: {
      status: ChallengeStatus.ESCALATED,
      escalatedAt: now,
      lastPushAt: now,
    },
  });

  const dispatched = await dispatchNotification(
    notification.id,
    tokenValues,
    payload
  );

  if (dispatched) {
    await prisma.pushNotification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.DISPATCHED, dispatchedAt: new Date() },
    });
  }

  return {
    notificationId: notification.id,
    dispatched,
    skipped: false,
  };
}

export async function sweepAndAggress(now: Date = new Date()): Promise<number> {
  const threshold = new Date(now.getTime() - AGGRESSOR_THRESHOLD_MS);
  const candidates = await prisma.livenessChallenge.findMany({
    where: {
      status: ChallengeStatus.PENDING,
      escalatedAt: null,
      createdAt: { lte: threshold },
    },
    select: { id: true },
  });

  for (const candidate of candidates) {
    await triggerAggressivePush(candidate.id, now);
  }

  return candidates.length;
}

export function startPushAggressor(intervalMs = 60_000): () => void {
  const timer = setInterval(() => {
    sweepAndAggress().catch((err) => {
      console.error("[PushAggressor] sweep failed", err);
    });
  }, intervalMs);
  return () => clearInterval(timer);
}
