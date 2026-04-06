ALTER TABLE "tasks" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "payload" jsonb;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "form_data";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "result";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "error";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "updated_at";