import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function calendarRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /calendar/:userId
   * Returns all events for a user, ordered by date.
   */
  app.get<{ Params: { userId: string } }>(
    "/calendar/:userId",
    async (request, reply) => {
      const { userId } = request.params;
      const events = await prisma.event.findMany({
        where: { userId },
        orderBy: { date: "asc" },
      });
      return reply.send({ events });
    }
  );

  /**
   * POST /calendar
   * Creates a new calendar event for a user.
   * Body: { userId, title, date, time, attendees?, isAI? }
   */
  app.post<{
    Body: {
      userId: string;
      title: string;
      date: string;
      time: string;
      attendees?: string[];
      isAI?: boolean;
    };
  }>("/calendar", async (request, reply) => {
    const { userId, title, date, time, attendees, isAI } = request.body;
    if (!userId || !title || !date || !time) {
      return reply
        .code(400)
        .send({ error: "userId, title, date, time required" });
    }
    const event = await prisma.event.create({
      data: {
        userId,
        title,
        date: new Date(date),
        time,
        attendees: JSON.stringify(attendees ?? []),
        isAI: isAI ?? false,
      },
    });
    return reply.code(201).send({ event });
  });

  /**
   * PUT /calendar/:id
   * Updates an existing calendar event (scoped to owner).
   */
  app.put<{
    Params: { id: string };
    Body: {
      userId: string;
      title?: string;
      date?: string;
      time?: string;
      attendees?: string[];
      isAI?: boolean;
    };
  }>("/calendar/:id", async (request, reply) => {
    const { id } = request.params;
    const { userId, title, date, time, attendees, isAI } = request.body;
    if (!userId) {
      return reply.code(400).send({ error: "userId required" });
    }
    const existing = await prisma.event.findFirst({ where: { id, userId } });
    if (!existing) {
      return reply.code(404).send({ error: "Event not found" });
    }
    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(time !== undefined && { time }),
        ...(attendees !== undefined && { attendees: JSON.stringify(attendees) }),
        ...(isAI !== undefined && { isAI }),
      },
    });
    return reply.send({ event });
  });

  /**
   * DELETE /calendar/:id
   * Deletes a calendar event (scoped to owner).
   */
  app.delete<{ Params: { id: string }; Body: { userId: string } }>(
    "/calendar/:id",
    async (request, reply) => {
      const { id } = request.params;
      const { userId } = request.body;
      if (!userId) {
        return reply.code(400).send({ error: "userId required" });
      }
      const existing = await prisma.event.findFirst({ where: { id, userId } });
      if (!existing) {
        return reply.code(404).send({ error: "Event not found" });
      }
      await prisma.event.delete({ where: { id } });
      return reply.send({ status: "deleted" });
    }
  );
}
