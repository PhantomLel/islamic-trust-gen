ALTER TABLE "help_query" DROP CONSTRAINT IF EXISTS "help_query_kb_entry_version_id_kb_entry_version_id_fk";
--> statement-breakpoint
ALTER TABLE "help_query" DROP CONSTRAINT IF EXISTS "help_query_template_version_id_help_template_version_id_fk";
--> statement-breakpoint
ALTER TABLE "help_query" DROP COLUMN IF EXISTS "kb_entry_version_id";
--> statement-breakpoint
ALTER TABLE "help_query" DROP COLUMN IF EXISTS "template_version_id";
--> statement-breakpoint
ALTER TABLE "help_query" DROP COLUMN IF EXISTS "classification";
--> statement-breakpoint
ALTER TABLE "help_query" DROP COLUMN IF EXISTS "latency_ms";
--> statement-breakpoint
ALTER TABLE "kb_entry" DROP COLUMN IF EXISTS "display_order";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "keywords";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "related_steps";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "classification_raw";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "stability_code";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "stability_raw";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "source_links";
--> statement-breakpoint
ALTER TABLE "kb_entry_internal" DROP COLUMN IF EXISTS "escalate_if_raw";
--> statement-breakpoint
ALTER TABLE "kb_entry_governance" DROP COLUMN IF EXISTS "review_due_at";
--> statement-breakpoint
ALTER TABLE "help_conversation" DROP COLUMN IF EXISTS "unresolved_escalation_tier";
--> statement-breakpoint
ALTER TABLE "help_template" DROP COLUMN IF EXISTS "placeholder_schema";
--> statement-breakpoint
DROP TABLE IF EXISTS "kb_entry_policy";
--> statement-breakpoint
DROP TABLE IF EXISTS "help_template_version";
