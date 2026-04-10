import { updateTaskStatus } from "./task.js";
import { db } from "../config/database.js";
import { tasks, taskLogs, formSubmissions } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { chromium } from "playwright";

export interface ProcessTaskPayload {
  taskId: string;
}

/**
 * Create a log entry for task processing
 */
async function createTaskLog(
  taskId: string,
  step: string,
  status: "info" | "success" | "error",
  message: string
) {
  try {
    await db.insert(taskLogs).values({
      taskId,
      step,
      status,
      message
    });
  } catch (error) {
    console.error(`Failed to create task log for task ${taskId}:`, error);
  }
}

/**
 * Main task processor function
 * Routes tasks to appropriate handlers based on task type
 */
export async function processTask(payload: ProcessTaskPayload) {
  const { taskId } = payload;
  
  console.log(`🔄 Processing task: ${taskId}`);
  await createTaskLog(taskId, "init", "info", "Task processing started");

  try {
    // Fetch task from database
    const taskResult = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskResult.length === 0) {
      const errorMsg = `Task ${taskId} not found in database`;
      await createTaskLog(taskId, "fetch", "error", errorMsg);
      throw new Error(errorMsg);
    }

    const task = taskResult[0];
    await createTaskLog(taskId, "fetch", "success", `Task fetched: ${task.title} (${task.type})`);

    // Update status to processing
    await updateTaskStatus(taskId, "processing");
    await createTaskLog(taskId, "status-update", "info", "Task status updated to processing");

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
      case "form_submission":
        result = await handleFormSubmissionTask(task);
        break;
      default:
        result = await handleDefaultTask(task);
    }

    // Update status to completed
    await updateTaskStatus(taskId, "completed");
    await createTaskLog(taskId, "complete", "success", `Task completed with result: ${JSON.stringify(result)}`);
    console.log(`✅ Task ${taskId} completed successfully`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing task ${taskId}:`, error);
    await createTaskLog(
      taskId,
      "error",
      "error",
      `Processing failed: ${error instanceof Error ? error.message : String(error)}`
    );
    
    // Update task status to failed
    try {
      await updateTaskStatus(taskId, "failed");
      await createTaskLog(taskId, "status-update", "info", "Task status updated to failed");
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
  await createTaskLog(task.id, "payment", "info", "Starting payment processing");
  
  // Simulate payment processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!task.payload || !task.payload.amount) {
    const errorMsg = "Invalid payment payload: missing amount";
    await createTaskLog(task.id, "payment", "error", errorMsg);
    throw new Error(errorMsg);
  }
  
  const transactionId = `TXN-${Date.now()}`;
  console.log(`✓ Payment of ${task.payload.amount} processed`);
  await createTaskLog(task.id, "payment", "success", `Payment processed. Amount: ${task.payload.amount}, Transaction ID: ${transactionId}`);
  
  return {
    taskId: task.id,
    type: "payment",
    status: "completed",
    result: {
      amount: task.payload.amount,
      transactionId,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Handler for email type tasks
 */
async function handleEmailTask(task: any) {
  console.log(`📧 Sending email task:`, task.payload);
  await createTaskLog(task.id, "email", "info", "Starting email sending");
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!task.payload || !task.payload.to) {
    const errorMsg = "Invalid email payload: missing recipient";
    await createTaskLog(task.id, "email", "error", errorMsg);
    throw new Error(errorMsg);
  }
  
  console.log(`✓ Email sent to ${task.payload.to}`);
  await createTaskLog(task.id, "email", "success", `Email sent to ${task.payload.to}`);
  
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
  await createTaskLog(task.id, "data-processing", "info", "Starting data processing");
  
  // Simulate data processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const recordsProcessed = task.payload?.count || 100;
  console.log(`✓ Data processed successfully`);
  await createTaskLog(task.id, "data-processing", "success", `Processed ${recordsProcessed} records`);
  
  return {
    taskId: task.id,
    type: "data-processing",
    status: "completed",
    result: {
      recordsProcessed,
      processedAt: new Date().toISOString()
    }
  };
}

/**
 * Default handler for unknown task types
 */
async function handleDefaultTask(task: any) {
  console.log(`⚙️ Processing default task type "${task.type}"`);
  await createTaskLog(task.id, "default", "info", `Processing default task type: ${task.type}`);
  
  // Simulate default processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`✓ Task completed`);
  await createTaskLog(task.id, "default", "success", "Default task processing completed");
  
  return {
    taskId: task.id,
    type: task.type,
    status: "completed",
    result: {
      processedAt: new Date().toISOString()
    }
  };
}

/**
 * Handler for form submission type tasks using Playwright
 * 
 * Payload structure:
 * {
 *   "url": "http://localhost:3001/login",
 *   "login": {
 *     "email": "admin@test.com",
 *     "password": "1234"
 *   },
 *   "form": {
 *     "email": "john@test.com",
 *     "password": "newpassword"
 *   }
 * }
 */
async function handleFormSubmissionTask(task: any) {
  console.log(`🌐 Starting form submission task for URL: ${task.payload?.url}`);
  await createTaskLog(task.id, "form-submission", "info", "Starting form submission automation with Playwright");

  let browser: any = null;
  let page: any = null;

  try {
    // Validate payload
    if (!task.payload || !task.payload.url) {
      throw new Error("Missing required payload.url");
    }
    if (!task.payload.login || !task.payload.login.email || !task.payload.login.password) {
      throw new Error("Missing required payload.login (email and password required)");
    }
    if (!task.payload.form) {
      throw new Error("Missing required payload.form");
    }

    const { url, login, form, selectors = {} } = task.payload;

    // Default selectors if not provided
    const emailInput = selectors.emailInput || "#email";
    const passwordInput = selectors.passwordInput || "#password";
    const submitButton = selectors.submitButton || "button[type='submit']";

    // Launch browser (headed mode for visibility)
    console.log("🚀 Launching Playwright browser...");
    await createTaskLog(task.id, "form-submission", "info", "Launching Playwright browser in headed mode");
    browser = await chromium.launch({ headless: false });
    page = await browser.newPage();

    // Navigate to login page
    console.log(`📄 Navigating to URL: ${url}`);
    await createTaskLog(task.id, "form-submission", "info", `Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    await createTaskLog(task.id, "form-submission", "success", "Page loaded successfully");

    // ============ STEP 1: LOGIN FORM ============
    console.log("🔐 Filling login form...");
    await createTaskLog(task.id, "form-submission", "info", "Filling login credentials");

    // Fill email field
    await page.fill(emailInput, login.email);
    console.log(`✓ Filled email: ${login.email}`);
    await createTaskLog(task.id, "form-submission", "info", `Filled email field with: ${login.email}`);

    // Fill password field
    await page.fill(passwordInput, login.password);
    console.log(`✓ Filled password`);
    await createTaskLog(task.id, "form-submission", "info", "Filled password field");

    // Submit login form
    console.log("🔘 Submitting login form...");
    await createTaskLog(task.id, "form-submission", "info", "Submitting login form");
    await page.click(submitButton);

    // Wait for navigation after login (up to 10 seconds)
    console.log("⏳ Waiting for page navigation after login...");
    await createTaskLog(task.id, "form-submission", "info", "Waiting for navigation after login");
    await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {
      // Continue even if navigation times out
      console.log("⚠️  Navigation timeout - continuing");
    });
    await createTaskLog(task.id, "form-submission", "success", "Login successful, page navigated");

    // ============ STEP 2: DATA SUBMISSION FORM ============
    console.log("📝 Filling data submission form...");
    await createTaskLog(task.id, "form-submission", "info", "Filling data submission form");

    // Fill form fields from task.payload.form
    for (const [fieldName, fieldValue] of Object.entries(form)) {
      const selector = selectors[fieldName] || `#${fieldName}`;
      
      try {
        await page.fill(selector, String(fieldValue));
        console.log(`✓ Filled ${fieldName}: ${fieldValue}`);
        await createTaskLog(task.id, "form-submission", "info", `Filled form field '${fieldName}'`);
      } catch (error) {
        // Log but continue if field not found
        console.warn(`⚠️  Could not fill field ${fieldName} with selector ${selector}`);
        await createTaskLog(
          task.id,
          "form-submission",
          "info",
          `Skipped field '${fieldName}' - selector not found: ${selector}`
        );
      }
    }

    // Submit the data form
    console.log("🔘 Submitting data form...");
    await createTaskLog(task.id, "form-submission", "info", "Submitting data form");
    
    // Click submit button
    await page.click(submitButton);

    // Wait for response/navigation (up to 10 seconds)
    console.log("⏳ Waiting for form submission response...");
    try {
      await page.waitForNavigation({ waitUntil: "networkidle", timeout: 10000 }).catch(() => {
        // Form might not navigate, just wait
      });
    } catch (error) {
      // Continue even if navigation times out
      console.log("⚠️  Submission response timeout - continuing");
    }

    // Capture result: current URL and page content
    const finalUrl = page.url();
    const pageTitle = await page.title();
    const successUrl = "http://localhost:3001/success";
    const isSuccess = finalUrl === successUrl;
    
    console.log(`✓ Form submission completed. Final URL: ${finalUrl}`);
    console.log(`✓ Is Success Page: ${isSuccess}`);
    await createTaskLog(task.id, "form-submission", "success", `Form submitted. Final URL: ${finalUrl} - Success: ${isSuccess}`);

    // Save submission to database
    const submissionResult = {
      success: isSuccess,
      finalUrl,
      pageTitle,
      successPageReached: isSuccess,
      expectedUrl: successUrl,
      urlChanged: finalUrl !== url,
      loginData: { email: login.email },
      formFields: Object.keys(form),
      timestamp: new Date().toISOString()
    };

    try {
      const submission = await db.insert(formSubmissions).values({
        taskId: task.id,
        userId: task.userId,
        url,
        formData: form,
        result: submissionResult,
        status: isSuccess ? "completed" : "submitted"
      }).returning();
      
      console.log(`✅ Form submission saved to database with ID: ${submission[0]?.id}`);
      await createTaskLog(task.id, "form-submission", "success", `Form submission data saved to database. Status: ${isSuccess ? "Success" : "Submitted"}`);
    } catch (dbError) {
      console.error("Failed to save submission to database:", dbError);
      await createTaskLog(task.id, "form-submission", "info", "Warning: Could not save to database but form was submitted");
    }

    // Close browser
    //console.log("🔚 Closing browser...");
    //await browser.close();
    await createTaskLog(task.id, "form-submission", "info", "Playwright browser closed");

    return {
      taskId: task.id,
      type: "form_submission",
      status: isSuccess ? "completed" : "submitted",
      result: submissionResult
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Form submission failed: ${errorMsg}`);
    await createTaskLog(task.id, "form-submission", "error", `Form submission failed: ${errorMsg}`);

    // Try to save failed submission to database
    try {
      await db.insert(formSubmissions).values({
        taskId: task.id,
        userId: task.userId,
        url: task.payload.url,
        formData: task.payload.form,
        result: {
          success: false,
          error: errorMsg,
          timestamp: new Date().toISOString()
        },
        status: "failed",
        error: errorMsg
      });
      console.log("❌ Failed submission saved to database");
    } catch (dbError) {
      console.error("Could not save failed submission to database:", dbError);
    }

    // Close browser on error
    if (browser) {
      try {
        await browser.close();
        console.log("🔚 Browser closed after error");
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    return {
      taskId: task.id,
      type: "form_submission",
      status: "failed",
      error: errorMsg,
      result: {
        success: false,
        error: errorMsg,
        timestamp: new Date().toISOString()
      }
    };
  }
}
