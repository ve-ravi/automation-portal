import { updateTaskStatus } from "./task.js";
import { db } from "../config/database.js";
import { tasks } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface ProcessTaskPayload {
  taskId: string;
}

/**
 * Main task processor function
 * Routes tasks to appropriate handlers based on task type
 */
export async function processTask(payload: ProcessTaskPayload) {
  const { taskId } = payload;
  
  console.log(`🔄 Processing task: ${taskId}`);

  try {
    // Fetch task from database
    const taskResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) {
      throw new Error(`Task ${taskId} not found in database`);
    }

    const task = taskResult[0];

    // Update status to processing
    await updateTaskStatus(taskId, "processing");

    // Route to appropriate handler based on task type
    let result;
    switch (task.type.toLowerCase()) {
      case "payment":
        result = await handlePaymentTask(task);
        break;
      case "email":
        result = await handleEmailTask(task);
        break;
      case "data-processing":
        result = await handleDataProcessingTask(task);
        break;
      default:
        result = await handleDefaultTask(task);
    }

    // Update status to completed
    await updateTaskStatus(taskId, "completed");
    console.log(`✅ Task ${taskId} completed successfully`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing task ${taskId}:`, error);
    
    // Update task status to failed
    try {
      await updateTaskStatus(taskId, "failed");
    } catch (updateError) {
      console.error(`Failed to update task status to failed:`, updateError);
    }
    
    throw error;
  }
}

/**
 * Handler for payment type tasks
 */
async function handlePaymentTask(task: any) {
  console.log(`💳 Processing payment task:`, task.payload);
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!task.payload || !task.payload.amount) {
    throw new Error("Invalid payment payload: missing amount");
  }
  
  console.log(`✓ Payment of ${task.payload.amount} processed`);
  return {
    taskId: task.id,
    type: "payment",
    status: "completed",
    result: {
      amount: task.payload.amount,
      transactionId: `TXN-${Date.now()}`,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Handler for email type tasks
 */
async function handleEmailTask(task: any) {
  console.log(`📧 Sending email task:`, task.payload);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!task.payload || !task.payload.to) {
    throw new Error("Invalid email payload: missing recipient");
  }
  
  console.log(`✓ Email sent to ${task.payload.to}`);
  return {
    taskId: task.id,
    type: "email",
    status: "completed",
    result: {
      recipient: task.payload.to,
      sentAt: new Date().toISOString()
    }
  };
}

/**
 * Handler for data-processing type tasks
 */
async function handleDataProcessingTask(task: any) {
  console.log(`📊 Processing data task:`, task.payload);
  
  // Simulate data processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log(`✓ Data processed successfully`);
  return {
    taskId: task.id,
    type: "data-processing",
    status: "completed",
    result: {
      recordsProcessed: task.payload?.count || 100,
      processedAt: new Date().toISOString()
    }
  };
}

/**
 * Default handler for unknown task types
 */
async function handleDefaultTask(task: any) {
  console.log(`⚙️ Processing default task type "${task.type}"`);
  
  // Simulate default processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`✓ Task completed`);
  return {
    taskId: task.id,
    type: task.type,
    status: "completed",
    result: {
      processedAt: new Date().toISOString()
    }
  };
}
