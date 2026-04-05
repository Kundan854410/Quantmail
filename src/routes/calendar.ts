import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { parseEventFromText } from "../services/calendarParser";

export async function calendarRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /calendar/:userId
   * Returns all calendar events for a user, ordered by start time.
   */
  app.get<{
    Params: { userId: string };
  }>("/calendar/:userId", async (request, reply) => {
    const { userId } = request.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    const events = await prisma.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    });

    return reply.send({ events });
  });

  /**
   * POST /calendar
   * Creates a new calendar event for a user.
   * Body: { userId, title, startTime, endTime }
   */
  app.post<{
    Body: {
      userId: string;
      title: string;
      startTime: string;
      endTime: string;
    };
  }>("/calendar", async (request, reply) => {
    const { userId, title, startTime, endTime } = request.body;

    if (!userId || !title || !startTime || !endTime) {
      return reply
        .code(400)
        .send({ error: "userId, title, startTime, and endTime are required" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return reply
        .code(400)
        .send({ error: "startTime and endTime must be valid ISO date strings" });
    }

    if (end <= start) {
      return reply
        .code(400)
        .send({ error: "endTime must be after startTime" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: title.trim(),
        startTime: start,
        endTime: end,
      },
    });

    return reply.code(201).send({ event });
  });

  /**
   * DELETE /calendar/:eventId
   * Deletes a calendar event by its ID.
   */
  app.delete<{
    Params: { eventId: string };
  }>("/calendar/:eventId", async (request, reply) => {
    const { eventId } = request.params;

    const event = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      return reply.code(404).send({ error: "Calendar event not found" });
    }

    await prisma.calendarEvent.delete({ where: { id: eventId } });

    return reply.code(200).send({ status: "deleted" });
  });

  /**
   * POST /calendar/parse
   * AI Scheduling Assistant — parses a natural-language prompt into a
   * structured calendar event payload: { title, startTime, endTime }.
   *
   * Body: { prompt: string }
   *
   * Uses a built-in mock NLP parser.  Replace parseEventFromText() with
   * a Vercel AI SDK call when an OPENAI_API_KEY is available in env.
   */
  app.post<{
    Body: { prompt: string };
  }>("/calendar/parse", async (request, reply) => {
    const { prompt } = request.body;

    if (!prompt || typeof prompt !== "string") {
      return reply.code(400).send({ error: "prompt is required" });
    }

    const result = parseEventFromText(prompt.trim());

    if ("error" in result) {
      return reply.code(422).send({ error: result.error });
    }

    return reply.send({
      title: result.title,
      startTime: result.startTime.toISOString(),
      endTime: result.endTime.toISOString(),
    });
  });
}
