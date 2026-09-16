import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "meetings" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_meetings_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "gallery_items" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "albums" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_albums_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "team_members" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_team_members_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "policies" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_policies_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "sponsors" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_sponsors_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "posts" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_posts_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  ALTER TABLE "media" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "monthly_flyers" ADD COLUMN "deleted_at" timestamp(3) with time zone;
  ALTER TABLE "_monthly_flyers_v" ADD COLUMN "version_deleted_at" timestamp(3) with time zone;
  CREATE INDEX "pages_deleted_at_idx" ON "pages" USING btree ("deleted_at");
  CREATE INDEX "_pages_v_version_version_deleted_at_idx" ON "_pages_v" USING btree ("version_deleted_at");
  CREATE INDEX "meetings_deleted_at_idx" ON "meetings" USING btree ("deleted_at");
  CREATE INDEX "_meetings_v_version_version_deleted_at_idx" ON "_meetings_v" USING btree ("version_deleted_at");
  CREATE INDEX "events_deleted_at_idx" ON "events" USING btree ("deleted_at");
  CREATE INDEX "_events_v_version_version_deleted_at_idx" ON "_events_v" USING btree ("version_deleted_at");
  CREATE INDEX "gallery_items_deleted_at_idx" ON "gallery_items" USING btree ("deleted_at");
  CREATE INDEX "_gallery_items_v_version_version_deleted_at_idx" ON "_gallery_items_v" USING btree ("version_deleted_at");
  CREATE INDEX "albums_deleted_at_idx" ON "albums" USING btree ("deleted_at");
  CREATE INDEX "_albums_v_version_version_deleted_at_idx" ON "_albums_v" USING btree ("version_deleted_at");
  CREATE INDEX "team_members_deleted_at_idx" ON "team_members" USING btree ("deleted_at");
  CREATE INDEX "_team_members_v_version_version_deleted_at_idx" ON "_team_members_v" USING btree ("version_deleted_at");
  CREATE INDEX "products_deleted_at_idx" ON "products" USING btree ("deleted_at");
  CREATE INDEX "_products_v_version_version_deleted_at_idx" ON "_products_v" USING btree ("version_deleted_at");
  CREATE INDEX "policies_deleted_at_idx" ON "policies" USING btree ("deleted_at");
  CREATE INDEX "_policies_v_version_version_deleted_at_idx" ON "_policies_v" USING btree ("version_deleted_at");
  CREATE INDEX "sponsors_deleted_at_idx" ON "sponsors" USING btree ("deleted_at");
  CREATE INDEX "_sponsors_v_version_version_deleted_at_idx" ON "_sponsors_v" USING btree ("version_deleted_at");
  CREATE INDEX "posts_deleted_at_idx" ON "posts" USING btree ("deleted_at");
  CREATE INDEX "_posts_v_version_version_deleted_at_idx" ON "_posts_v" USING btree ("version_deleted_at");
  CREATE INDEX "media_deleted_at_idx" ON "media" USING btree ("deleted_at");
  CREATE INDEX "monthly_flyers_deleted_at_idx" ON "monthly_flyers" USING btree ("deleted_at");
  CREATE INDEX "_monthly_flyers_v_version_version_deleted_at_idx" ON "_monthly_flyers_v" USING btree ("version_deleted_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "pages_deleted_at_idx";
  DROP INDEX "_pages_v_version_version_deleted_at_idx";
  DROP INDEX "meetings_deleted_at_idx";
  DROP INDEX "_meetings_v_version_version_deleted_at_idx";
  DROP INDEX "events_deleted_at_idx";
  DROP INDEX "_events_v_version_version_deleted_at_idx";
  DROP INDEX "gallery_items_deleted_at_idx";
  DROP INDEX "_gallery_items_v_version_version_deleted_at_idx";
  DROP INDEX "albums_deleted_at_idx";
  DROP INDEX "_albums_v_version_version_deleted_at_idx";
  DROP INDEX "team_members_deleted_at_idx";
  DROP INDEX "_team_members_v_version_version_deleted_at_idx";
  DROP INDEX "products_deleted_at_idx";
  DROP INDEX "_products_v_version_version_deleted_at_idx";
  DROP INDEX "policies_deleted_at_idx";
  DROP INDEX "_policies_v_version_version_deleted_at_idx";
  DROP INDEX "sponsors_deleted_at_idx";
  DROP INDEX "_sponsors_v_version_version_deleted_at_idx";
  DROP INDEX "posts_deleted_at_idx";
  DROP INDEX "_posts_v_version_version_deleted_at_idx";
  DROP INDEX "media_deleted_at_idx";
  DROP INDEX "monthly_flyers_deleted_at_idx";
  DROP INDEX "_monthly_flyers_v_version_version_deleted_at_idx";
  ALTER TABLE "pages" DROP COLUMN "deleted_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "meetings" DROP COLUMN "deleted_at";
  ALTER TABLE "_meetings_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "events" DROP COLUMN "deleted_at";
  ALTER TABLE "_events_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "gallery_items" DROP COLUMN "deleted_at";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "albums" DROP COLUMN "deleted_at";
  ALTER TABLE "_albums_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "team_members" DROP COLUMN "deleted_at";
  ALTER TABLE "_team_members_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "products" DROP COLUMN "deleted_at";
  ALTER TABLE "_products_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "policies" DROP COLUMN "deleted_at";
  ALTER TABLE "_policies_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "sponsors" DROP COLUMN "deleted_at";
  ALTER TABLE "_sponsors_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "posts" DROP COLUMN "deleted_at";
  ALTER TABLE "_posts_v" DROP COLUMN "version_deleted_at";
  ALTER TABLE "media" DROP COLUMN "deleted_at";
  ALTER TABLE "monthly_flyers" DROP COLUMN "deleted_at";
  ALTER TABLE "_monthly_flyers_v" DROP COLUMN "version_deleted_at";`)
}
