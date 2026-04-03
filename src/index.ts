import Fastify from "fastify";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { db } from "./config/database.js";

const start = async () => {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug"
    }
  });

  // Test database connection
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
  }

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);

  // Start server
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    console.log(`✅ Server running at http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
