import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_kind" AS ENUM('dated', 'meeting', 'legacy');
  CREATE TYPE "public"."enum_events_time_mode" AS ENUM('known', 'allDay', 'unannounced');
  CREATE TYPE "public"."enum__events_v_version_kind" AS ENUM('dated', 'meeting', 'legacy');
  CREATE TYPE "public"."enum__events_v_version_time_mode" AS ENUM('known', 'allDay', 'unannounced');
  ALTER TABLE "events" ADD COLUMN "kind" "enum_events_kind" DEFAULT 'legacy';
  ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'dated';
  ALTER TABLE "events" ADD COLUMN "date" varchar;
  ALTER TABLE "events" ADD COLUMN "end_date" varchar;
  ALTER TABLE "events" ADD COLUMN "time_mode" "enum_events_time_mode" DEFAULT 'unannounced';
  ALTER TABLE "events" ADD COLUMN "start_time" varchar;
  ALTER TABLE "events" ADD COLUMN "end_time" varchar;
  ALTER TABLE "events" ADD COLUMN "location" varchar;
  ALTER TABLE "events" ALTER COLUMN "location" SET DEFAULT 'Serenity Club of Clearwater';
  ALTER TABLE "events" ADD COLUMN "meeting_id" integer;
  ALTER TABLE "events" ADD COLUMN "archived" boolean DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "featured" boolean DEFAULT true;
  ALTER TABLE "events" ALTER COLUMN "featured" SET DEFAULT false;
  ALTER TABLE "events" ADD COLUMN "source_flyer_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_kind" "enum__events_v_version_kind" DEFAULT 'legacy';
  ALTER TABLE "_events_v" ALTER COLUMN "version_kind" SET DEFAULT 'dated';
  ALTER TABLE "_events_v" ADD COLUMN "version_date" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_end_date" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_time_mode" "enum__events_v_version_time_mode" DEFAULT 'unannounced';
  ALTER TABLE "_events_v" ADD COLUMN "version_start_time" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_end_time" varchar;
  ALTER TABLE "_events_v" ADD COLUMN "version_location" varchar;
  ALTER TABLE "_events_v" ALTER COLUMN "version_location" SET DEFAULT 'Serenity Club of Clearwater';
  ALTER TABLE "_events_v" ADD COLUMN "version_meeting_id" integer;
  ALTER TABLE "_events_v" ADD COLUMN "version_archived" boolean DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_featured" boolean DEFAULT true;
  ALTER TABLE "_events_v" ALTER COLUMN "version_featured" SET DEFAULT false;
  ALTER TABLE "_events_v" ADD COLUMN "version_source_flyer_id" integer;
  ALTER TABLE "events" ADD CONSTRAINT "events_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_source_flyer_id_monthly_flyers_id_fk" FOREIGN KEY ("source_flyer_id") REFERENCES "public"."monthly_flyers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_meeting_id_meetings_id_fk" FOREIGN KEY ("version_meeting_id") REFERENCES "public"."meetings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_source_flyer_id_monthly_flyers_id_fk" FOREIGN KEY ("version_source_flyer_id") REFERENCES "public"."monthly_flyers"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_meeting_idx" ON "events" USING btree ("meeting_id");
  CREATE INDEX "events_source_flyer_idx" ON "events" USING btree ("source_flyer_id");
  CREATE INDEX "_events_v_version_version_meeting_idx" ON "_events_v" USING btree ("version_meeting_id");
  CREATE INDEX "_events_v_version_version_source_flyer_idx" ON "_events_v" USING btree ("version_source_flyer_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DROP CONSTRAINT "events_meeting_id_meetings_id_fk";
  
  ALTER TABLE "events" DROP CONSTRAINT "events_source_flyer_id_monthly_flyers_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_meeting_id_meetings_id_fk";
  
  ALTER TABLE "_events_v" DROP CONSTRAINT "_events_v_version_source_flyer_id_monthly_flyers_id_fk";
  
  DROP INDEX "events_meeting_idx";
  DROP INDEX "events_source_flyer_idx";
  DROP INDEX "_events_v_version_version_meeting_idx";
  DROP INDEX "_events_v_version_version_source_flyer_idx";
  ALTER TABLE "events" DROP COLUMN "kind";
  ALTER TABLE "events" DROP COLUMN "date";
  ALTER TABLE "events" DROP COLUMN "end_date";
  ALTER TABLE "events" DROP COLUMN "time_mode";
  ALTER TABLE "events" DROP COLUMN "start_time";
  ALTER TABLE "events" DROP COLUMN "end_time";
  ALTER TABLE "events" DROP COLUMN "location";
  ALTER TABLE "events" DROP COLUMN "meeting_id";
  ALTER TABLE "events" DROP COLUMN "archived";
  ALTER TABLE "events" DROP COLUMN "featured";
  ALTER TABLE "events" DROP COLUMN "source_flyer_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_kind";
  ALTER TABLE "_events_v" DROP COLUMN "version_date";
  ALTER TABLE "_events_v" DROP COLUMN "version_end_date";
  ALTER TABLE "_events_v" DROP COLUMN "version_time_mode";
  ALTER TABLE "_events_v" DROP COLUMN "version_start_time";
  ALTER TABLE "_events_v" DROP COLUMN "version_end_time";
  ALTER TABLE "_events_v" DROP COLUMN "version_location";
  ALTER TABLE "_events_v" DROP COLUMN "version_meeting_id";
  ALTER TABLE "_events_v" DROP COLUMN "version_archived";
  ALTER TABLE "_events_v" DROP COLUMN "version_featured";
  ALTER TABLE "_events_v" DROP COLUMN "version_source_flyer_id";
  DROP TYPE "public"."enum_events_kind";
  DROP TYPE "public"."enum_events_time_mode";
  DROP TYPE "public"."enum__events_v_version_kind";
  DROP TYPE "public"."enum__events_v_version_time_mode";`)
}
