import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth";
import { inboxRoutes } from "./routes/inbox";
import { digitalTwinRoutes } from "./routes/digitalTwin";
import { iotRoutes } from "./routes/iot";
import { quanteditsRoutes } from "./routes/quantedits";
import { pushRoutes } from "./routes/push";
import { quanttubeRoutes } from "./routes/quanttube";
import { mailRoutes } from "./routes/mail";
import { calendarRoutes } from "./routes/calendar";
import { docsRoutes } from "./routes/docs";
import { driveRoutes } from "./routes/drive";
import { sheetsRoutes } from "./routes/sheets";
import { landingPage } from "./landing";

const app = Fastify({ logger: true });

async function main(): Promise<void> {
  await app.register(cors, { origin: true });
  await app.register(authRoutes);
  await app.register(inboxRoutes);
  await app.register(digitalTwinRoutes);
  await app.register(iotRoutes);
  await app.register(quanteditsRoutes);
  await app.register(pushRoutes);
  await app.register(quanttubeRoutes);
  await app.register(mailRoutes);
  await app.register(calendarRoutes);
  await app.register(docsRoutes);
  await app.register(driveRoutes);
  await app.register(sheetsRoutes);

  app.get("/health", async () => ({ status: "ok", service: "quantmail" }));

  app.get("/", async (_request, reply) => {
    return reply.type("text/html").send(landingPage);
  });

  const port = parseInt(process.env["PORT"] || "3000", 10);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
