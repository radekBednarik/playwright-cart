CREATE TABLE "revoked_tokens" (
	"jti" text PRIMARY KEY NOT NULL,
	"exp" timestamp with time zone NOT NULL
);
