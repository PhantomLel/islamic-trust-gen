CREATE TABLE IF NOT EXISTS "kb_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"entry_type" text NOT NULL,
	"category" text,
	"title" text,
	"question" text,
	"user_facing_answer" text,
	"good_tree_app_meaning" text,
	"user_next_step" text,
	"display_order" integer DEFAULT 0,
	"rerank_document" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_entry_source_id_unique" UNIQUE("source_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_entry_category_idx" ON "kb_entry" USING btree ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_entry_type_idx" ON "kb_entry" USING btree ("entry_type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_entry_internal" (
	"entry_id" integer PRIMARY KEY NOT NULL,
	"also_answers" text[],
	"keywords" text[],
	"related_steps" text[],
	"classification_base" text,
	"classification_raw" text,
	"stability_code" text,
	"stability_raw" text,
	"source_review_note" text,
	"source_links" text,
	"source_hash" text,
	"needs_manual_policy" boolean DEFAULT false NOT NULL,
	"escalate_if_raw" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_entry_policy" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"condition_code" text NOT NULL,
	"trigger_code" text,
	"tier" text,
	"template_id" text,
	"allowed_answer_mode" text,
	"creates_flag" boolean DEFAULT false NOT NULL,
	"blocks_step" boolean DEFAULT false NOT NULL,
	"consult_required" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_entry_policy_entry_idx" ON "kb_entry_policy" USING btree ("entry_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_entry_governance" (
	"entry_id" integer PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'needs_revision' NOT NULL,
	"last_reviewed_at" timestamp,
	"last_reviewed_by" text,
	"review_due_at" timestamp,
	"approved_at" timestamp,
	"approved_by" text,
	"serve_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_publication_gate" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_type" text NOT NULL,
	"content_id" text NOT NULL,
	"gate_type" text NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"satisfied" boolean DEFAULT false NOT NULL,
	"reviewer_id" text,
	"reviewed_at" timestamp,
	"evidence_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kb_publication_gate_unique_idx" ON "kb_publication_gate" USING btree ("content_type","content_id","gate_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_publication_gate_unsatisfied_idx" ON "kb_publication_gate" USING btree ("satisfied","required");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kb_entry_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"entry_id" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"source_hash" text,
	"author_id" text,
	"change_reason" text,
	"reviewer_id" text,
	"approval_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kb_entry_version_entry_idx" ON "kb_entry_version" USING btree ("entry_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"placeholder_schema" jsonb,
	"status" text DEFAULT 'needs_revision' NOT NULL,
	"source_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "help_template_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_template_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_row_id" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"author_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_template_version_tpl_idx" ON "help_template_version" USING btree ("template_row_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_staff_macro" (
	"id" serial PRIMARY KEY NOT NULL,
	"macro_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text,
	"source_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "help_staff_macro_macro_id_unique" UNIQUE("macro_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_setting" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_conversation" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"trust_id" integer,
	"surface" text NOT NULL,
	"step_key" text,
	"turn_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"max_tier" text,
	"unresolved_escalation_tier" text,
	"has_redaction" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_conversation_user_idx" ON "help_conversation" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_conversation_trust_idx" ON "help_conversation" USING btree ("trust_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_query" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"turn_index" integer NOT NULL,
	"question_text" text NOT NULL,
	"matched_entry_ids" jsonb,
	"selected_entry_source_id" text,
	"kb_entry_version_id" integer,
	"template_version_id" integer,
	"classification" text,
	"resolved_tier" text,
	"trigger_codes" jsonb,
	"rerank_score" text,
	"runner_up_score" text,
	"threshold_config_version" text,
	"provider_model_versions" jsonb,
	"latency_ms" integer,
	"rendered_response" jsonb NOT NULL,
	"cta_shown" text,
	"unanswered" boolean DEFAULT false NOT NULL,
	"has_redaction" boolean DEFAULT false NOT NULL,
	"admin_review_status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_query_conversation_idx" ON "help_query" USING btree ("conversation_id","turn_index");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_query_user_idx" ON "help_query" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_query_unanswered_idx" ON "help_query" USING btree ("unanswered","admin_review_status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_rate_limit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bucket" text NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "help_rate_limit_unique_idx" ON "help_rate_limit" USING btree ("user_id","bucket","window_started_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_cta_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"cta_key" text NOT NULL,
	"target" text NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "help_cta_event_idempotent_idx" ON "help_cta_event" USING btree ("query_id","cta_key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_escalation" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" integer NOT NULL,
	"conversation_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"trust_id" integer,
	"surface" text,
	"step_key" text,
	"tier" text NOT NULL,
	"trigger_code" text NOT NULL,
	"response_policy" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"notified_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_escalation_status_idx" ON "help_escalation" USING btree ("status","tier");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_escalation_user_idx" ON "help_escalation" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_step_block" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"trust_id" integer,
	"surface" text NOT NULL,
	"step_key" text NOT NULL,
	"escalation_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "help_step_block_active_idx" ON "help_step_block" USING btree ("user_id","surface","step_key","active");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "help_transcript_access_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" text,
	"conversation_id" integer,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kb_entry_internal" ADD CONSTRAINT "kb_entry_internal_entry_id_kb_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."kb_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kb_entry_policy" ADD CONSTRAINT "kb_entry_policy_entry_id_kb_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."kb_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kb_entry_governance" ADD CONSTRAINT "kb_entry_governance_entry_id_kb_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."kb_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kb_entry_version" ADD CONSTRAINT "kb_entry_version_entry_id_kb_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."kb_entry"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_template_version" ADD CONSTRAINT "help_template_version_template_row_id_help_template_id_fk" FOREIGN KEY ("template_row_id") REFERENCES "public"."help_template"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_conversation" ADD CONSTRAINT "help_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_query" ADD CONSTRAINT "help_query_conversation_id_help_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."help_conversation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_query" ADD CONSTRAINT "help_query_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_rate_limit" ADD CONSTRAINT "help_rate_limit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_cta_event" ADD CONSTRAINT "help_cta_event_query_id_help_query_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."help_query"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_cta_event" ADD CONSTRAINT "help_cta_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_escalation" ADD CONSTRAINT "help_escalation_query_id_help_query_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."help_query"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_escalation" ADD CONSTRAINT "help_escalation_conversation_id_help_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."help_conversation"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_escalation" ADD CONSTRAINT "help_escalation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_step_block" ADD CONSTRAINT "help_step_block_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "help_transcript_access_log" ADD CONSTRAINT "help_transcript_access_log_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
