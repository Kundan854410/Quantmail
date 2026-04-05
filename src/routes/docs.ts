import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function docsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /docs/:userId
   * Returns all documents for a user, most recently modified first.
   */
  app.get<{ Params: { userId: string } }>(
    "/docs/:userId",
    async (request, reply) => {
      const { userId } = request.params;
      const documents = await prisma.document.findMany({
        where: { userId },
        orderBy: { lastModified: "desc" },
      });
      return reply.send({ documents });
    }
  );

  /**
   * GET /docs/:userId/:id
   * Returns a single document by id, scoped to user.
   */
  app.get<{ Params: { userId: string; id: string } }>(
    "/docs/:userId/:id",
    async (request, reply) => {
      const { userId, id } = request.params;
      const document = await prisma.document.findFirst({
        where: { id, userId },
      });
      if (!document) {
        return reply.code(404).send({ error: "Document not found" });
      }
      return reply.send({ document });
    }
  );

  /**
   * POST /docs
   * Creates a new document for a user.
   * Body: { userId, title, content? }
   */
  app.post<{
    Body: { userId: string; title: string; content?: string };
  }>("/docs", async (request, reply) => {
    const { userId, title, content } = request.body;
    if (!userId || !title) {
      return reply.code(400).send({ error: "userId and title required" });
    }
    const document = await prisma.document.create({
      data: { userId, title, content: content ?? "" },
    });
    return reply.code(201).send({ document });
  });

  /**
   * PUT /docs/:id
   * Updates title and/or content of an existing document (scoped to owner).
   */
  app.put<{
    Params: { id: string };
    Body: { userId: string; title?: string; content?: string };
  }>("/docs/:id", async (request, reply) => {
    const { id } = request.params;
    const { userId, title, content } = request.body;
    if (!userId) {
      return reply.code(400).send({ error: "userId required" });
    }
    const existing = await prisma.document.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.code(404).send({ error: "Document not found" });
    }
    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
      },
    });
    return reply.send({ document });
  });

  /**
   * DELETE /docs/:id
   * Deletes a document (scoped to owner).
   */
  app.delete<{ Params: { id: string }; Body: { userId: string } }>(
    "/docs/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;
      if (!userId) {
        return reply.code(400).send({ error: "userId required" });
      }
      const existing = await prisma.document.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.code(404).send({ error: "Document not found" });
      }
      await prisma.document.delete({ where: { id } });
      return reply.send({ status: "deleted" });
    }
  );
}
