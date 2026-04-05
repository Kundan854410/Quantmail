import { FastifyInstance } from "fastify";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "../db";
import {
  silenceAlarmFromDashboardPhysicalLogin,
  triggerSynchronizedWebBluetoothAlarm,
} from "../services/criticalAlarmService";

const MILLISECONDS_PER_MINUTE = 60_000;
const MIN_PHYSICAL_SESSION_MINUTES = 1;
const MAX_PHYSICAL_SESSION_MINUTES = 60;
const IOT_RATE_LIMIT_WINDOW_MS = 60_000;
const IOT_RATE_LIMIT_MAX = 20;
const iotRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const SILENCE_RATE_LIMIT_WINDOW_MS = 60_000;
const SILENCE_RATE_LIMIT_MAX = 10;
const silenceRateLimitMap = new Map<
  string,
  { count: number; resetAt: number }
>();
const DEVICE_PROOF_HMAC_SECRET =
  process.env["DEVICE_PROOF_HMAC_SECRET"] ||
  "quantmail-device-proof-dev-secret";

function sweepExpiredRateLimitEntries(
  now: number,
  map: Map<string, { count: number; resetAt: number }>
): void {
  for (const [key, value] of map.entries()) {
    if (now > value.resetAt) {
      map.delete(key);
    }
  }
}

function checkIotRateLimit(ip: string): boolean {
  const now = Date.now();
  sweepExpiredRateLimitEntries(now, iotRateLimitMap);
  const entry = iotRateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    iotRateLimitMap.set(ip, {
      count: 1,
      resetAt: now + IOT_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }
  entry.count++;
  return entry.count <= IOT_RATE_LIMIT_MAX;
}

function checkSilenceRateLimit(key: string): boolean {
  const now = Date.now();
  sweepExpiredRateLimitEntries(now, silenceRateLimitMap);
  const entry = silenceRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    silenceRateLimitMap.set(key, {
      count: 1,
      resetAt: now + SILENCE_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }
  entry.count++;
  return entry.count <= SILENCE_RATE_LIMIT_MAX;
}

function deriveDeviceProof(
  userId: string,
  dashboardOrigin: string,
  timestamp: number
): string {
  return createHmac("sha256", DEVICE_PROOF_HMAC_SECRET)
    .update(`${userId}:${dashboardOrigin}:${timestamp}`)
    .digest("hex");
}

function verifyDeviceProof(
  proof: string,
  userId: string,
  dashboardOrigin: string,
  timestamp: number
): boolean {
  const expected = deriveDeviceProof(userId, dashboardOrigin, timestamp);
  try {
    return timingSafeEqual(Buffer.from(proof), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function iotRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /iot/device/register
   * Registers a connected IoT device for alarm dispatching.
   */
  app.post<{
    Body: {
      userId: string;
      deviceName: string;
      platform: string;
      connectionType?: string;
      endpointRef: string;
    };
  }>("/iot/device/register", async (request, reply) => {
    if (!checkIotRateLimit(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const { userId, deviceName, platform, connectionType, endpointRef } =
      request.body;
    if (!userId || !deviceName || !platform || !endpointRef) {
      return reply.code(400).send({
        error: "userId, deviceName, platform, and endpointRef required",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    const device = await prisma.connectedIoTDevice.upsert({
      where: {
        device_unique_identifier: {
          userId,
          endpointRef,
          platform,
        },
      },
      update: { deviceName, connectionType: connectionType || "WebBluetooth" },
      create: {
        userId,
        deviceName,
        platform,
        connectionType: connectionType || "WebBluetooth",
        endpointRef,
      },
    });

    return reply.code(201).send({ device });
  });

  /**
   * POST /iot/alarm/trigger
   * Manually triggers a synchronized alarm across all user devices.
   */
  app.post<{
    Body: {
      userId: string;
      source: string;
      subject: string;
      body: string;
    };
  }>("/iot/alarm/trigger", async (request, reply) => {
    if (!checkIotRateLimit(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const { userId, source, subject, body } = request.body;
    if (!userId || !source || !subject) {
      return reply
        .code(400)
        .send({ error: "userId, source, and subject required" });
    }

    const alarm = await triggerSynchronizedWebBluetoothAlarm({
      userId,
      source,
      subject,
      body: body || "",
    });

    return reply.code(201).send(alarm);
  });

  /**
   * POST /iot/dashboard/physical-login
   * Registers a physical dashboard login session for alarm silencing.
   */
  app.post<{
    Body: {
      userId: string;
      dashboardOrigin: string;
      deviceProof: string;
      proofTimestamp: number;
      sessionMinutes?: number;
    };
  }>("/iot/dashboard/physical-login", async (request, reply) => {
    if (!checkIotRateLimit(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const { userId, dashboardOrigin, deviceProof, proofTimestamp } =
      request.body;
    if (!userId || !dashboardOrigin || !deviceProof || !proofTimestamp) {
      return reply.code(400).send({
        error:
          "userId, dashboardOrigin, deviceProof, and proofTimestamp required",
      });
    }

    if (!verifyDeviceProof(deviceProof, userId, dashboardOrigin, proofTimestamp)) {
      return reply.code(403).send({ error: "INVALID_DEVICE_PROOF" });
    }

    const rawMinutes = request.body.sessionMinutes ?? 15;
    const sessionMinutes = Math.max(
      MIN_PHYSICAL_SESSION_MINUTES,
      Math.min(MAX_PHYSICAL_SESSION_MINUTES, rawMinutes)
    );

    const session = await prisma.dashboardPhysicalLogin.create({
      data: {
        userId,
        dashboardOrigin,
        loginMethod: "PHYSICAL",
        deviceProof,
        expiresAt: new Date(
          Date.now() + sessionMinutes * MILLISECONDS_PER_MINUTE
        ),
      },
    });

    return reply.code(201).send({
      status: "physical_login_verified",
      dashboardSessionId: session.id,
      expiresAt: session.expiresAt,
    });
  });

  /**
   * POST /iot/alarm/silence
   * Silences an active alarm using a physical dashboard login session.
   */
  app.post<{
    Body: {
      userId: string;
      alertId: string;
      dashboardSessionId: string;
      silenceChallenge: string;
    };
  }>("/iot/alarm/silence", async (request, reply) => {
    if (!checkIotRateLimit(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const { userId, alertId, dashboardSessionId, silenceChallenge } =
      request.body;
    if (!userId || !alertId || !dashboardSessionId || !silenceChallenge) {
      return reply.code(400).send({
        error:
          "userId, alertId, dashboardSessionId, and silenceChallenge are required",
      });
    }
    const silenceKey = `${request.ip}:${userId}:${dashboardSessionId}`;
    if (!checkSilenceRateLimit(silenceKey)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const result = await silenceAlarmFromDashboardPhysicalLogin({
      userId,
      alertId,
      dashboardSessionId,
      silenceChallenge,
    });

    if (!result.silenced) {
      const isAuthError =
        result.reason === "PHYSICAL_DASHBOARD_LOGIN_REQUIRED";
      return reply.code(isAuthError ? 403 : 404).send({
        error: result.reason,
      });
    }

    return reply.send({
      status: "silenced",
      alarmSilencedBy: "physical_dashboard_login",
    });
  });
}
