import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createTask, updateTaskStatus } from "../services/task.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { addTaskJob } from "../config/queue.js";

const VALID_PRIORITIES = ["low", "medium", "high"];

export async function taskRoutes(fastify: FastifyInstance) {
  // Create task endpoint (protected)
  fastify.post(
    "/tasks",
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { title, type, payload, priority } = request.body as {
          title: string;
          type: string;
          payload?: Record<string, any>;
          priority: string;
        };

        // Validate required fields
        if (!title || !type || !priority) {
          return sendError(reply, "Missing required fields: title, type, priority", 400);
        }

        // Validate title
        if (typeof title !== "string" || title.trim().length === 0) {
          return sendError(reply, "Title must be a non-empty string", 400);
        }

        // Validate type
        if (typeof type !== "string" || type.trim().length === 0) {
          return sendError(reply, "Type must be a non-empty string", 400);
        }

        // Validate priority
        if (!VALID_PRIORITIES.includes(priority.toLowerCase())) {
          return sendError(
            reply,
            `Priority must be one of: ${VALID_PRIORITIES.join(", ")}`,
            400
          );
        }

        // Validate payload (if provided)
        if (payload !== undefined && (typeof payload !== "object" || payload === null)) {
          return sendError(reply, "Payload must be a valid object", 400);
        }

        // Create task
        const task = await createTask({
          userId: request.user!.id,
          title: title.trim(),
          type: type.trim(),
          priority: priority.toLowerCase() as "low" | "medium" | "high",
          payload: payload || undefined
        });

        // Push task to queue
        try {
          await addTaskJob(task.id);
          
          // Update task status to queued
          const queuedTask = await updateTaskStatus(task.id, "queued");
          
          return sendSuccess(reply, queuedTask, 201, "Task created and queued successfully");
        } catch (queueError) {
          const message = queueError instanceof Error ? queueError.message : "Failed to queue task";
          console.error("Queue error:", message);
          // Task was created but queueing failed, still return success with warning
          return sendSuccess(reply, task, 201, "Task created but failed to queue - will be processed manually");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create task";
        return sendError(reply, message, 400);
      }
    }
  );
}
