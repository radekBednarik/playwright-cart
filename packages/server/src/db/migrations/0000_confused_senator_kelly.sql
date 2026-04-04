CREATE TYPE "public"."run_status" AS ENUM('running', 'passed', 'failed', 'interrupted', 'timedOut');--> statement-breakpoint
CREATE TYPE "public"."test_status" AS ENUM('passed', 'failed', 'timedOut', 'skipped', 'interrupted');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "runs" (
	"run_id" text PRIMARY KEY NOT NULL,
	"project" text NOT NULL,
	"branch" text,
	"commit_sha" text,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "run_status" DEFAULT 'running' NOT NULL,
	"report_url" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_annotations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"test_pk" bigint NOT NULL,
	"position" integer NOT NULL,
	"type" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_attachments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"test_pk" bigint NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"content_type" text NOT NULL,
	"filename" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_errors" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"test_pk" bigint NOT NULL,
	"position" integer NOT NULL,
	"message" text NOT NULL,
	"stack" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"test_id" text NOT NULL,
	"run_id" text NOT NULL,
	"title" text NOT NULL,
	"title_path" text[] NOT NULL,
	"location_file" text NOT NULL,
	"location_line" integer NOT NULL,
	"location_col" integer NOT NULL,
	"status" "test_status" NOT NULL,
	"duration_ms" integer NOT NULL,
	"retry" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_annotations" ADD CONSTRAINT "test_annotations_test_pk_tests_id_fk" FOREIGN KEY ("test_pk") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_attachments" ADD CONSTRAINT "test_attachments_test_pk_tests_id_fk" FOREIGN KEY ("test_pk") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_errors" ADD CONSTRAINT "test_errors_test_pk_tests_id_fk" FOREIGN KEY ("test_pk") REFERENCES "public"."tests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tests" ADD CONSTRAINT "tests_run_id_runs_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("run_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "runs_started_at_idx" ON "runs" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tests_run_test_uniq" ON "tests" USING btree ("run_id","test_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tests_run_id_idx" ON "tests" USING btree ("run_id");