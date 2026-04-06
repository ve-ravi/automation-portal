ALTER TABLE "tasks" ADD COLUMN "type" text NOT NULL DEFAULT 'default';
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" text NOT NULL DEFAULT 'medium';
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "payload" jsonb;
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "title" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
CREATE TYPE "status_enum" AS ENUM('pending', 'queued', 'processing', 'completed', 'failed');
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "status" TYPE "status_enum" USING "status"::"status_enum";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "form_data";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "result";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "error";
--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "updated_at";

