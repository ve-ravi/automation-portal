import Queue from "bull";
import { redisUrl } from "./redis.js";

// Define job data types
export interface ProcessTaskJob {
  taskId: string;
}

// Create task processing queue
export const taskQueue = new Queue<ProcessTaskJob>("process-task", redisUrl, {
  defaultJobOptions: {
    attempts: 3, // Retry 3 times on failure
    backoff: {
      type: "exponential",
      delay: 2000 // Start with 2 second delay
    },
    removeOnComplete: true, // Clean up successful jobs
    removeOnFail: false // Keep failed jobs for debugging
  }
});

// Queue event listeners
taskQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

taskQueue.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

taskQueue.on("active", (job) => {
  console.log(`⏳ Job ${job.id} started processing`);
});

export async function addTaskJob(taskId: string) {
  try {
    const job = await taskQueue.add({ taskId }, {
      jobId: taskId // Use taskId as job ID for tracking
    });
    console.log(`📌 Task ${taskId} added to queue, job ID: ${job.id}`);
    return job;
  } catch (error) {
    console.error(`Failed to add task to queue:`, error);
    throw error;
  }
}

export async function closeQueue() {
  await taskQueue.close();
}
