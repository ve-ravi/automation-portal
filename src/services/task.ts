import { db } from "../config/database.js";
import { tasks } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface CreateTaskInput {
  userId: string;
  title: string;
  type: string;
  priority: "low" | "medium" | "high";
  payload?: Record<string, any>;
}

export interface TaskData {
  id: string;
  userId: string;
  title: string;
  type: string;
  priority: string;
  payload: any;
  status: string;
  createdAt: Date | null;
}

export async function createTask(input: CreateTaskInput): Promise<TaskData> {
  const result = await db
    .insert(tasks)
    .values({
      userId: input.userId,
      title: input.title,
      type: input.type,
      priority: input.priority,
      payload: input.payload || null,
      status: "pending"
    })
    .returning({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      type: tasks.type,
      priority: tasks.priority,
      payload: tasks.payload,
      status: tasks.status,
      createdAt: tasks.createdAt
    });

  if (result.length === 0) {
    throw new Error("Failed to create task");
  }

  return result[0];
}

export async function updateTaskStatus(
  taskId: string,
  status: "pending" | "queued" | "processing" | "completed" | "failed"
): Promise<TaskData> {
  const result = await db
    .update(tasks)
    .set({ status })
    .where(eq(tasks.id, taskId))
    .returning({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      type: tasks.type,
      priority: tasks.priority,
      payload: tasks.payload,
      status: tasks.status,
      createdAt: tasks.createdAt
    });

  if (result.length === 0) {
    throw new Error(`Task ${taskId} not found`);
  }

  return result[0];
}
