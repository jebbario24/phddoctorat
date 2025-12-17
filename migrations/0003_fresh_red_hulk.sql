CREATE TABLE "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thesis_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"category" varchar DEFAULT 'general' NOT NULL,
	"mastery_level" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "research_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"type" varchar DEFAULT 'thought',
	"tags" text[] DEFAULT '{}',
	"date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "references" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "references" ADD COLUMN "matrix_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "theses" ADD COLUMN "degree_type" varchar DEFAULT 'phd';--> statement-breakpoint
ALTER TABLE "theses" ADD COLUMN "target_completion_date" timestamp;--> statement-breakpoint
ALTER TABLE "theses" ADD COLUMN "matrix_columns" text[];--> statement-breakpoint
ALTER TABLE "theses" ADD COLUMN "methodology_type" varchar;--> statement-breakpoint
ALTER TABLE "theses" ADD COLUMN "specific_methodology" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interface_language" varchar DEFAULT 'english';--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_thesis_id_theses_id_fk" FOREIGN KEY ("thesis_id") REFERENCES "public"."theses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_entries" ADD CONSTRAINT "research_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;