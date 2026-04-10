import Fastify from "fastify";
import cors from "@fastify/cors";
import { sql } from "drizzle-orm";
import { env } from "./config/env.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { taskRoutes } from "./routes/tasks.js";
import { db } from "./config/database.js";
import { taskQueue } from "./config/queue.js";

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

  // Test Redis connection
  try {
    await taskQueue.client.ping();
    console.log("✅ Redis connected successfully");
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1);
  }

  // Register CORS plugin
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true, // Allow cookies and auth headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  // Initialize task queue
  console.log("📋 Task queue initialized (worker process handles job processing)");

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(authRoutes);
  await fastify.register(taskRoutes);

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
