import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dues_reminder_mode" AS ENUM('automatic', 'chosen', 'off', 'legacy');
  CREATE TYPE "public"."enum_dues_reminder_artwork_kind" AS ENUM('none', 'decoration', 'monthly');
  CREATE TYPE "public"."enum_dues_reminder_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__dues_reminder_v_version_mode" AS ENUM('automatic', 'chosen', 'off', 'legacy');
  CREATE TYPE "public"."enum__dues_reminder_v_version_artwork_kind" AS ENUM('none', 'decoration', 'monthly');
  CREATE TYPE "public"."enum__dues_reminder_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "dues_reminder" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mode" "enum_dues_reminder_mode" DEFAULT 'legacy',
  	"month" varchar,
  	"message" varchar DEFAULT 'Thank you for helping keep the Serenity Club open for our recovery community.',
  	"show_membership_link" boolean DEFAULT true,
  	"artwork_kind" "enum_dues_reminder_artwork_kind" DEFAULT 'none',
  	"artwork_id" integer,
  	"artwork_month" varchar,
  	"_status" "enum_dues_reminder_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_dues_reminder_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_mode" "enum__dues_reminder_v_version_mode" DEFAULT 'legacy',
  	"version_month" varchar,
  	"version_message" varchar DEFAULT 'Thank you for helping keep the Serenity Club open for our recovery community.',
  	"version_show_membership_link" boolean DEFAULT true,
  	"version_artwork_kind" "enum__dues_reminder_v_version_artwork_kind" DEFAULT 'none',
  	"version_artwork_id" integer,
  	"version_artwork_month" varchar,
  	"version__status" "enum__dues_reminder_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "dues_reminder" ADD CONSTRAINT "dues_reminder_artwork_id_media_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_dues_reminder_v" ADD CONSTRAINT "_dues_reminder_v_version_artwork_id_media_id_fk" FOREIGN KEY ("version_artwork_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "dues_reminder_artwork_idx" ON "dues_reminder" USING btree ("artwork_id");
  CREATE INDEX "dues_reminder__status_idx" ON "dues_reminder" USING btree ("_status");
  CREATE INDEX "_dues_reminder_v_version_version_artwork_idx" ON "_dues_reminder_v" USING btree ("version_artwork_id");
  CREATE INDEX "_dues_reminder_v_version_version__status_idx" ON "_dues_reminder_v" USING btree ("version__status");
  CREATE INDEX "_dues_reminder_v_created_at_idx" ON "_dues_reminder_v" USING btree ("created_at");
  CREATE INDEX "_dues_reminder_v_updated_at_idx" ON "_dues_reminder_v" USING btree ("updated_at");
  CREATE INDEX "_dues_reminder_v_latest_idx" ON "_dues_reminder_v" USING btree ("latest");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "dues_reminder" CASCADE;
  DROP TABLE "_dues_reminder_v" CASCADE;
  DROP TYPE "public"."enum_dues_reminder_mode";
  DROP TYPE "public"."enum_dues_reminder_artwork_kind";
  DROP TYPE "public"."enum_dues_reminder_status";
  DROP TYPE "public"."enum__dues_reminder_v_version_mode";
  DROP TYPE "public"."enum__dues_reminder_v_version_artwork_kind";
  DROP TYPE "public"."enum__dues_reminder_v_version_status";`)
}
