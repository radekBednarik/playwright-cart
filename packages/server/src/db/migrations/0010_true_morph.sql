CREATE TYPE "public"."ai_entity_type" AS ENUM('run', 'test');--> statement-breakpoint
CREATE TYPE "public"."ai_summary_status" AS ENUM('pending', 'generating', 'done', 'error');--> statement-breakpoint
CREATE TABLE "ai_summaries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"entity_type" "ai_entity_type" NOT NULL,
	"entity_id" text NOT NULL,
	"run_id" text NOT NULL,
	"status" "ai_summary_status" DEFAULT 'pending' NOT NULL,
	"content" text,
	"error_msg" text,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"generated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "ai_summaries" ADD CONSTRAINT "ai_summaries_run_id_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("run_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ai_summaries_entity_uniq" ON "ai_summaries" USING btree ("entity_type","run_id","entity_id");