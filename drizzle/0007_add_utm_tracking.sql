-- Create utm_tracking_event table for tracking landing and will completion events
CREATE TABLE IF NOT EXISTS "utm_tracking_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"will_id" integer,
	"email" text,
	"session_id" text,
	"payload" jsonb
);

-- Create indexes for utm_tracking_event
CREATE INDEX IF NOT EXISTS "utm_tracking_event_type_idx" ON "utm_tracking_event" ("event_type");
CREATE INDEX IF NOT EXISTS "utm_tracking_event_source_idx" ON "utm_tracking_event" ("utm_source");
CREATE INDEX IF NOT EXISTS "utm_tracking_event_session_idx" ON "utm_tracking_event" ("session_id");
CREATE INDEX IF NOT EXISTS "utm_tracking_event_will_idx" ON "utm_tracking_event" ("will_id");

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "utm_tracking_event" ADD CONSTRAINT "utm_tracking_event_will_id_free_will_id_fk" FOREIGN KEY ("will_id") REFERENCES "public"."free_will"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
