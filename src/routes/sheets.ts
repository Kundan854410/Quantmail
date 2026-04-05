import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function sheetsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /sheets/:userId
   * Returns all sheets for a user, most recently modified first.
   */
  app.get<{ Params: { userId: string } }>(
    "/sheets/:userId",
    async (request, reply) => {
      const { userId } = request.params;
      const sheets = await prisma.sheet.findMany({
        where: { userId },
        orderBy: { lastModified: "desc" },
      });
      return reply.send({ sheets });
    }
  );

  /**
   * GET /sheets/:userId/:id
   * Returns a single sheet by id, scoped to user.
   */
  app.get<{ Params: { userId: string; id: string } }>(
    "/sheets/:userId/:id",
    async (request, reply) => {
      const { userId, id } = request.params;
      const sheet = await prisma.sheet.findFirst({
        where: { id, userId },
      });
      if (!sheet) {
        return reply.code(404).send({ error: "Sheet not found" });
      }
      return reply.send({ sheet });
    }
  );

  /**
   * POST /sheets
   * Creates a new sheet for a user.
   * Body: { userId, title, dataJson? }
   */
  app.post<{
    Body: { userId: string; title: string; dataJson?: string };
  }>("/sheets", async (request, reply) => {
    const { userId, title, dataJson } = request.body;
    if (!userId || !title) {
      return reply.code(400).send({ error: "userId and title required" });
    }
    const sheet = await prisma.sheet.create({
      data: { userId, title, dataJson: dataJson ?? "{}" },
    });
    return reply.code(201).send({ sheet });
  });

  /**
   * PUT /sheets/:id
   * Updates title and/or data of an existing sheet (scoped to owner).
   */
  app.put<{
    Params: { id: string };
    Body: { userId: string; title?: string; dataJson?: string };
  }>("/sheets/:id", async (request, reply) => {
    const { id } = request.params;
    const { userId, title, dataJson } = request.body;
    if (!userId) {
      return reply.code(400).send({ error: "userId required" });
    }
    const existing = await prisma.sheet.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.code(404).send({ error: "Sheet not found" });
    }
    const sheet = await prisma.sheet.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(dataJson !== undefined && { dataJson }),
      },
    });
    return reply.send({ sheet });
  });

  /**
   * DELETE /sheets/:id
   * Deletes a sheet (scoped to owner).
   */
  app.delete<{ Params: { id: string }; Body: { userId: string } }>(
    "/sheets/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;
      if (!userId) {
        return reply.code(400).send({ error: "userId required" });
      }
      const existing = await prisma.sheet.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.code(404).send({ error: "Sheet not found" });
      }
      await prisma.sheet.delete({ where: { id } });
      return reply.send({ status: "deleted" });
    }
  );
}
