import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import {
  verifyMasterSSOToken,
  encryptApiKey,
} from "../utils/crypto";
import { maskStoredKey } from "../utils/maskKey";
import { createRateLimiter } from "../utils/rateLimit";

const SSO_SECRET = process.env["SSO_SECRET"] || "quantmail-dev-secret";
const ENCRYPTION_SECRET =
  process.env["ENCRYPTION_SECRET"] || "quantmail-key-secret";

const rateLimiter = createRateLimiter({ max: 10 });

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /admin/config
   * Set global default AI provider keys (Admin only).
   * These keys are used when a user has not configured their own key.
   *
   * Authorization: Bearer <ssoToken>
   * Body: { globalOpenaiKey?, globalAnthropicKey?, globalGeminiKey?, customModelUrl?, customModelKey? }
   */
  app.post<{
    Body: {
      globalOpenaiKey?: string;
      globalAnthropicKey?: string;
      globalGeminiKey?: string;
      customModelUrl?: string;
      customModelKey?: string;
    };
  }>("/admin/config", async (request, reply) => {
    if (!rateLimiter.check(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const authHeader = request.headers["authorization"];
    const token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ error: "Authorization token required" });
    }

    const userId = verifyMasterSSOToken(token, SSO_SECRET);
    if (!userId) {
      return reply.code(403).send({ error: "Invalid or expired token" });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return reply
        .code(403)
        .send({ error: "Access denied. Admin role required." });
    }

    const {
      globalOpenaiKey,
      globalAnthropicKey,
      globalGeminiKey,
      customModelUrl,
      customModelKey,
    } = request.body;

    const updateData: Record<string, string | null> = {};

    if (globalOpenaiKey !== undefined) {
      updateData.globalOpenaiKey = globalOpenaiKey
        ? encryptApiKey(globalOpenaiKey, ENCRYPTION_SECRET)
        : null;
    }
    if (globalAnthropicKey !== undefined) {
      updateData.globalAnthropicKey = globalAnthropicKey
        ? encryptApiKey(globalAnthropicKey, ENCRYPTION_SECRET)
        : null;
    }
    if (globalGeminiKey !== undefined) {
      updateData.globalGeminiKey = globalGeminiKey
        ? encryptApiKey(globalGeminiKey, ENCRYPTION_SECRET)
        : null;
    }
    if (customModelUrl !== undefined) {
      updateData.customModelUrl = customModelUrl || null;
    }
    if (customModelKey !== undefined) {
      updateData.customModelKey = customModelKey
        ? encryptApiKey(customModelKey, ENCRYPTION_SECRET)
        : null;
    }

    if (Object.keys(updateData).length === 0) {
      return reply
        .code(400)
        .send({ error: "At least one configuration field is required" });
    }

    // Upsert: update the most recent config or create one if none exists
    const existing = await prisma.adminConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    let config;
    if (existing) {
      config = await prisma.adminConfig.update({
        where: { id: existing.id },
        data: { ...updateData, updatedBy: userId },
      });
    } else {
      config = await prisma.adminConfig.create({
        data: { ...updateData, updatedBy: userId },
      });
    }

    return reply.send({
      message: "Global AI configuration updated successfully.",
      configId: config.id,
      updatedAt: config.updatedAt,
    });
  });

  /**
   * GET /admin/config
   * Retrieve the current global admin configuration (Admin only).
   * API keys are returned masked.
   *
   * Authorization: Bearer <ssoToken>
   */
  app.get("/admin/config", async (request, reply) => {
    if (!rateLimiter.check(request.ip)) {
      return reply.code(429).send({ error: "Rate limit exceeded" });
    }

    const authHeader = request.headers["authorization"];
    const token =
      authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return reply.code(401).send({ error: "Authorization token required" });
    }

    const userId = verifyMasterSSOToken(token, SSO_SECRET);
    if (!userId) {
      return reply.code(403).send({ error: "Invalid or expired token" });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return reply
        .code(403)
        .send({ error: "Access denied. Admin role required." });
    }

    const config = await prisma.adminConfig.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!config) {
      return reply.send({
        config: null,
        message: "No global configuration set. Use POST /admin/config to configure.",
      });
    }

    return reply.send({
      config: {
        id: config.id,
        globalOpenaiKey: maskStoredKey(config.globalOpenaiKey),
        globalAnthropicKey: maskStoredKey(config.globalAnthropicKey),
        globalGeminiKey: maskStoredKey(config.globalGeminiKey),
        customModelUrl: config.customModelUrl || null,
        customModelKey: maskStoredKey(config.customModelKey),
        updatedBy: config.updatedBy,
        updatedAt: config.updatedAt,
      },
    });
  });
}
