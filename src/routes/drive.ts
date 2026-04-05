import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function driveRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /drive/:userId
   * Returns all files for a user, newest uploads first.
   */
  app.get<{ Params: { userId: string } }>(
    "/drive/:userId",
    async (request, reply) => {
      const { userId } = request.params;
      const files = await prisma.file.findMany({
        where: { userId },
        orderBy: { uploadedAt: "desc" },
      });
      return reply.send({ files });
    }
  );

  /**
   * POST /drive
   * Creates a new file record for a user.
   * Body: { userId, name, type, size, url }
   */
  app.post<{
    Body: {
      userId: string;
      name: string;
      type: string;
      size: number;
      url: string;
    };
  }>("/drive", async (request, reply) => {
    const { userId, name, type, size, url } = request.body;
    if (!userId || !name || !type || size === undefined || !url) {
      return reply
        .code(400)
        .send({ error: "userId, name, type, size, url required" });
    }
    // Validate URL scheme to prevent SSRF / malicious link injection
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return reply.code(400).send({ error: "Invalid url format" });
    }
    if (!["https:", "http:"].includes(parsedUrl.protocol)) {
      return reply.code(400).send({ error: "url must use http or https protocol" });
    }
    const file = await prisma.file.create({
      data: { userId, name, type, size, url },
    });
    return reply.code(201).send({ file });
  });

  /**
   * DELETE /drive/:id
   * Deletes a file record (scoped to owner).
   */
  app.delete<{ Params: { id: string }; Body: { userId: string } }>(
    "/drive/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;
      if (!userId) {
        return reply.code(400).send({ error: "userId required" });
      }
      const existing = await prisma.file.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.code(404).send({ error: "File not found" });
      }
      await prisma.file.delete({ where: { id } });
      return reply.send({ status: "deleted" });
    }
  );
}
