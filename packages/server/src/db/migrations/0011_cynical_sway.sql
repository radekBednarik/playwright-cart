CREATE TABLE "llm_provider_configs" (
	"provider" text PRIMARY KEY NOT NULL,
	"api_key" text NOT NULL,
	"model" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "llm_provider_configs" ("provider", "api_key", "model")
SELECT
  s1.value,
  s2.value,
  COALESCE(
    s3.value,
    CASE s1.value
      WHEN 'anthropic' THEN 'claude-sonnet-4-6'
      ELSE 'openai/gpt-4.1'
    END
  )
FROM app_settings s1
JOIN app_settings s2 ON s2.key = 'llm_api_key'
LEFT JOIN app_settings s3 ON s3.key = 'llm_model'
WHERE s1.key = 'llm_provider';
