import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_meetings_sessions_days" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TYPE "public"."enum_meetings_sessions_recurrence" AS ENUM('weekly', 'monthly');
  CREATE TYPE "public"."enum_meetings_sessions_ordinal" AS ENUM('first', 'second', 'third', 'fourth', 'fifth', 'last');
  CREATE TYPE "public"."enum_meetings_sessions_format" AS ENUM('unknown', 'discussion', 'book', 'literature', 'speaker', 'beginner', 'celebration', 'business', 'other');
  CREATE TYPE "public"."enum_meetings_sessions_attendance" AS ENUM('unknown', 'everyone', 'recovery', 'women', 'men', 'members');
  CREATE TYPE "public"."enum_meetings_exceptions_action" AS ENUM('cancel', 'change');
  CREATE TYPE "public"."enum_meetings_exceptions_format" AS ENUM('unknown', 'discussion', 'book', 'literature', 'speaker', 'beginner', 'celebration', 'business', 'other');
  CREATE TYPE "public"."enum_meetings_exceptions_attendance" AS ENUM('unknown', 'everyone', 'recovery', 'women', 'men', 'members');
  CREATE TYPE "public"."enum__meetings_v_version_sessions_days" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TYPE "public"."enum__meetings_v_version_sessions_recurrence" AS ENUM('weekly', 'monthly');
  CREATE TYPE "public"."enum__meetings_v_version_sessions_ordinal" AS ENUM('first', 'second', 'third', 'fourth', 'fifth', 'last');
  CREATE TYPE "public"."enum__meetings_v_version_sessions_format" AS ENUM('unknown', 'discussion', 'book', 'literature', 'speaker', 'beginner', 'celebration', 'business', 'other');
  CREATE TYPE "public"."enum__meetings_v_version_sessions_attendance" AS ENUM('unknown', 'everyone', 'recovery', 'women', 'men', 'members');
  CREATE TYPE "public"."enum__meetings_v_version_exceptions_action" AS ENUM('cancel', 'change');
  CREATE TYPE "public"."enum__meetings_v_version_exceptions_format" AS ENUM('unknown', 'discussion', 'book', 'literature', 'speaker', 'beginner', 'celebration', 'business', 'other');
  CREATE TYPE "public"."enum__meetings_v_version_exceptions_attendance" AS ENUM('unknown', 'everyone', 'recovery', 'women', 'men', 'members');
  CREATE TABLE "meetings_sessions_days" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_meetings_sessions_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "meetings_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar,
  	"recurrence" "enum_meetings_sessions_recurrence" DEFAULT 'weekly',
  	"ordinal" "enum_meetings_sessions_ordinal",
  	"replaces" varchar,
  	"time" varchar,
  	"room" varchar,
  	"format" "enum_meetings_sessions_format" DEFAULT 'unknown',
  	"topic" varchar,
  	"attendance" "enum_meetings_sessions_attendance" DEFAULT 'unknown',
  	"confirmed" boolean DEFAULT false,
  	"from" varchar,
  	"until" varchar
  );
  
  CREATE TABLE "meetings_exceptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"session" varchar,
  	"date" varchar,
  	"action" "enum_meetings_exceptions_action" DEFAULT 'cancel',
  	"moved_to" varchar,
  	"time" varchar,
  	"room" varchar,
  	"format" "enum_meetings_exceptions_format" DEFAULT 'unknown',
  	"topic" varchar,
  	"attendance" "enum_meetings_exceptions_attendance" DEFAULT 'unknown',
  	"confirmed" boolean DEFAULT false,
  	"note" varchar
  );
  
  CREATE TABLE "_meetings_v_version_sessions_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__meetings_v_version_sessions_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_meetings_v_version_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar,
  	"recurrence" "enum__meetings_v_version_sessions_recurrence" DEFAULT 'weekly',
  	"ordinal" "enum__meetings_v_version_sessions_ordinal",
  	"replaces" varchar,
  	"time" varchar,
  	"room" varchar,
  	"format" "enum__meetings_v_version_sessions_format" DEFAULT 'unknown',
  	"topic" varchar,
  	"attendance" "enum__meetings_v_version_sessions_attendance" DEFAULT 'unknown',
  	"confirmed" boolean DEFAULT false,
  	"from" varchar,
  	"until" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_meetings_v_version_exceptions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"session" varchar,
  	"date" varchar,
  	"action" "enum__meetings_v_version_exceptions_action" DEFAULT 'cancel',
  	"moved_to" varchar,
  	"time" varchar,
  	"room" varchar,
  	"format" "enum__meetings_v_version_exceptions_format" DEFAULT 'unknown',
  	"topic" varchar,
  	"attendance" "enum__meetings_v_version_exceptions_attendance" DEFAULT 'unknown',
  	"confirmed" boolean DEFAULT false,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "meetings" ADD COLUMN "public_notes" varchar;
  ALTER TABLE "meetings" ADD COLUMN "checked_on" varchar;
  ALTER TABLE "meetings" ADD COLUMN "checked_by" varchar;
  ALTER TABLE "_meetings_v" ADD COLUMN "version_public_notes" varchar;
  ALTER TABLE "_meetings_v" ADD COLUMN "version_checked_on" varchar;
  ALTER TABLE "_meetings_v" ADD COLUMN "version_checked_by" varchar;
  ALTER TABLE "meetings_sessions_days" ADD CONSTRAINT "meetings_sessions_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."meetings_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "meetings_sessions" ADD CONSTRAINT "meetings_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "meetings_exceptions" ADD CONSTRAINT "meetings_exceptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_meetings_v_version_sessions_days" ADD CONSTRAINT "_meetings_v_version_sessions_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_meetings_v_version_sessions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_meetings_v_version_sessions" ADD CONSTRAINT "_meetings_v_version_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_meetings_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_meetings_v_version_exceptions" ADD CONSTRAINT "_meetings_v_version_exceptions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_meetings_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "meetings_sessions_days_order_idx" ON "meetings_sessions_days" USING btree ("order");
  CREATE INDEX "meetings_sessions_days_parent_idx" ON "meetings_sessions_days" USING btree ("parent_id");
  CREATE INDEX "meetings_sessions_order_idx" ON "meetings_sessions" USING btree ("_order");
  CREATE INDEX "meetings_sessions_parent_id_idx" ON "meetings_sessions" USING btree ("_parent_id");
  CREATE INDEX "meetings_exceptions_order_idx" ON "meetings_exceptions" USING btree ("_order");
  CREATE INDEX "meetings_exceptions_parent_id_idx" ON "meetings_exceptions" USING btree ("_parent_id");
  CREATE INDEX "_meetings_v_version_sessions_days_order_idx" ON "_meetings_v_version_sessions_days" USING btree ("order");
  CREATE INDEX "_meetings_v_version_sessions_days_parent_idx" ON "_meetings_v_version_sessions_days" USING btree ("parent_id");
  CREATE INDEX "_meetings_v_version_sessions_order_idx" ON "_meetings_v_version_sessions" USING btree ("_order");
  CREATE INDEX "_meetings_v_version_sessions_parent_id_idx" ON "_meetings_v_version_sessions" USING btree ("_parent_id");
  CREATE INDEX "_meetings_v_version_exceptions_order_idx" ON "_meetings_v_version_exceptions" USING btree ("_order");
  CREATE INDEX "_meetings_v_version_exceptions_parent_id_idx" ON "_meetings_v_version_exceptions" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "meetings_sessions_days" CASCADE;
  DROP TABLE "meetings_sessions" CASCADE;
  DROP TABLE "meetings_exceptions" CASCADE;
  DROP TABLE "_meetings_v_version_sessions_days" CASCADE;
  DROP TABLE "_meetings_v_version_sessions" CASCADE;
  DROP TABLE "_meetings_v_version_exceptions" CASCADE;
  ALTER TABLE "meetings" DROP COLUMN "public_notes";
  ALTER TABLE "meetings" DROP COLUMN "checked_on";
  ALTER TABLE "meetings" DROP COLUMN "checked_by";
  ALTER TABLE "_meetings_v" DROP COLUMN "version_public_notes";
  ALTER TABLE "_meetings_v" DROP COLUMN "version_checked_on";
  ALTER TABLE "_meetings_v" DROP COLUMN "version_checked_by";
  DROP TYPE "public"."enum_meetings_sessions_days";
  DROP TYPE "public"."enum_meetings_sessions_recurrence";
  DROP TYPE "public"."enum_meetings_sessions_ordinal";
  DROP TYPE "public"."enum_meetings_sessions_format";
  DROP TYPE "public"."enum_meetings_sessions_attendance";
  DROP TYPE "public"."enum_meetings_exceptions_action";
  DROP TYPE "public"."enum_meetings_exceptions_format";
  DROP TYPE "public"."enum_meetings_exceptions_attendance";
  DROP TYPE "public"."enum__meetings_v_version_sessions_days";
  DROP TYPE "public"."enum__meetings_v_version_sessions_recurrence";
  DROP TYPE "public"."enum__meetings_v_version_sessions_ordinal";
  DROP TYPE "public"."enum__meetings_v_version_sessions_format";
  DROP TYPE "public"."enum__meetings_v_version_sessions_attendance";
  DROP TYPE "public"."enum__meetings_v_version_exceptions_action";
  DROP TYPE "public"."enum__meetings_v_version_exceptions_format";
  DROP TYPE "public"."enum__meetings_v_version_exceptions_attendance";`)
}
