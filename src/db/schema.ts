import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  priority: text("priority").default("medium").notNull(),
  payload: jsonb("payload"),
  status: text("status", {
    enum: ["pending", "queued", "processing", "completed", "failed"]
  }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const taskLogs = pgTable("task_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  step: text("step"),
  status: text("status"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks)
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id]
  }),
  logs: many(taskLogs)
}));

export const taskLogsRelations = relations(taskLogs, ({ one }) => ({
  task: one(tasks, {
    fields: [taskLogs.taskId],
    references: [tasks.id]
  })
}));
