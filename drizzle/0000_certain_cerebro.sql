CREATE TABLE "admin_note" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"author_id" text,
	"author_name" text,
	"body" text NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "free_will" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"claim_email" text,
	"name" text,
	"state" text,
	"legal_mode" text,
	"responses" jsonb,
	"tags" text[],
	"recommended_plan" text,
	"review_reminders" boolean DEFAULT true NOT NULL,
	"complete" boolean DEFAULT false NOT NULL,
	"generated_files" jsonb
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"amount" integer DEFAULT 1199 NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"stripe_checkout_session_id" text
);
--> statement-breakpoint
CREATE TABLE "marketing_email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"lead_id" integer NOT NULL,
	"email" text NOT NULL,
	"sequence" text NOT NULL,
	"email_key" text NOT NULL,
	"subject" text NOT NULL,
	"resend_id" text
);
--> statement-breakpoint
CREATE TABLE "marketing_lead" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"user_id" text,
	"trust_id" integer,
	"first_touch_source" text,
	"last_touch_source" text,
	"lead_type" text,
	"quiz_result" text,
	"quiz_waqf" boolean DEFAULT false,
	"complexity_flags" text[],
	"app_status" text,
	"current_sequence" text,
	"sequence_status" text DEFAULT 'active',
	"next_email_index" integer DEFAULT 1,
	"next_email_at" timestamp,
	"last_email_at" timestamp,
	"last_email_key" text,
	"enrolled_at" timestamp,
	"stopped_at" timestamp,
	"stopped_reason" text,
	"unsubscribed" boolean DEFAULT false NOT NULL,
	"unsubscribe_token" text,
	"manual_follow_up" boolean DEFAULT false NOT NULL,
	"manual_follow_up_reasons" text[],
	CONSTRAINT "marketing_lead_email_unique" UNIQUE("email"),
	CONSTRAINT "marketing_lead_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"is_eligible" boolean,
	"joint" boolean,
	"screening_answers" jsonb,
	"responses" jsonb,
	"complete" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'started' NOT NULL,
	"approved" boolean DEFAULT false NOT NULL,
	"file_urls" text[],
	"house_deed_url" text,
	"generated_files" jsonb,
	"user_files" jsonb,
	"charities" jsonb,
	"selected_plan" text,
	"deed_retrieval_requested" boolean DEFAULT false NOT NULL,
	"custom_price" integer,
	"notarization_link_url" text,
	"notarization_link_token" text,
	"notarization_event_uri" text,
	"notarization_invitee_uri" text,
	"notarization_booked_at" timestamp,
	"notarization_start_time" timestamp,
	"notarization_end_time" timestamp,
	"loe_accepted_at" timestamp,
	"loe_agreement_data" jsonb,
	"warning_accepted_at" timestamp,
	"warning_agreement_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'client',
	"requested_consultation_at" timestamp,
	"requested_find_deed_at" timestamp,
	"county" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"last_login_user_agent" text,
	"files" jsonb,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_note" ADD CONSTRAINT "admin_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_note" ADD CONSTRAINT "admin_note_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_will" ADD CONSTRAINT "free_will_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_email_log" ADD CONSTRAINT "marketing_email_log_lead_id_marketing_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."marketing_lead"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_lead" ADD CONSTRAINT "marketing_lead_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trust" ADD CONSTRAINT "trust_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketing_email_log_lead_idx" ON "marketing_email_log" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "marketing_lead_next_email_idx" ON "marketing_lead" USING btree ("next_email_at");--> statement-breakpoint
CREATE INDEX "marketing_lead_user_idx" ON "marketing_lead" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");