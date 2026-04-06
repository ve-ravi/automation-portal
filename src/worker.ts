/**
 * Task Worker Process
 * 
 * This is a separate process that:
 * 1. Listens to the task queue
 * 2. Processes jobs concurrently
 * 3. Updates task status in the database
 * 4. Handles failures and retries
 * 
 * Run this in a separate terminal: npm run worker
 */

import { taskQueue } from "./config/queue.js";
import { processTask } from "./services/taskProcessor.js";
import type { Job } from "bull";

const WORKER_CONCURRENCY = 5; // Process up to 5 jobs concurrently

async function startWorker() {
  console.log("🚀 Task Worker started");

  // Define job processor
  taskQueue.process(WORKER_CONCURRENCY, async (job: Job) => {
    console.log(`\n📩 Received job: ${job.id}`);
    console.log(`   Task ID: ${job.data.taskId}`);
    console.log(`   Attempts: ${job.attemptsMade + 1}/${job.opts.attempts}`);

    try {
      const result = await processTask({
        taskId: job.data.taskId
      });

      console.log(`✅ Job ${job.id} processed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error instanceof Error ? error.message : error);
      throw error; // Bull will handle retries
    }
  });

  // Listen for queue events
  taskQueue.on("ready", () => {
    console.log("✅ Queue ready to process jobs");
  });

  taskQueue.on("error", (error: Error) => {
    console.error("❌ Queue error:", error);
  });

  taskQueue.on("active", (job: Job) => {
    console.log(`⏳ Job ${job.id} is now active`);
  });

  taskQueue.on("completed", (job: Job) => {
    console.log(`✅ Completed: Job ${job.id}`);
  });

  taskQueue.on("failed", (job: Job, error: Error) => {
    console.error(`❌ Failed: Job ${job.id} - ${error.message}`);
  });

  taskQueue.on("paused", () => {
    console.log("⏸️  Queue paused");
  });

  taskQueue.on("resumed", () => {
    console.log("▶️  Queue resumed");
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down worker...");
    try {
      await taskQueue.close();
      console.log("✅ Worker shutdown gracefully");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down worker...");
    try {
      await taskQueue.close();
      console.log("✅ Worker shutdown gracefully");
      process.exit(0);
    } catch (error) {
      console.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
}

startWorker().catch((error) => {
  console.error("Failed to start worker:", error);
  process.exit(1);
});
