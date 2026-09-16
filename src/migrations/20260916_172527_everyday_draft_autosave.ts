import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_meetings_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_events_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_albums_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_monthly_flyers_v" ADD COLUMN "autosave" boolean;
  ALTER TABLE "_dues_reminder_v" ADD COLUMN "autosave" boolean;
  CREATE INDEX "_meetings_v_autosave_idx" ON "_meetings_v" USING btree ("autosave");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE INDEX "_gallery_items_v_autosave_idx" ON "_gallery_items_v" USING btree ("autosave");
  CREATE INDEX "_albums_v_autosave_idx" ON "_albums_v" USING btree ("autosave");
  CREATE INDEX "_monthly_flyers_v_autosave_idx" ON "_monthly_flyers_v" USING btree ("autosave");
  CREATE INDEX "_dues_reminder_v_autosave_idx" ON "_dues_reminder_v" USING btree ("autosave");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "_meetings_v_autosave_idx";
  DROP INDEX "_events_v_autosave_idx";
  DROP INDEX "_gallery_items_v_autosave_idx";
  DROP INDEX "_albums_v_autosave_idx";
  DROP INDEX "_monthly_flyers_v_autosave_idx";
  DROP INDEX "_dues_reminder_v_autosave_idx";
  ALTER TABLE "_meetings_v" DROP COLUMN "autosave";
  ALTER TABLE "_events_v" DROP COLUMN "autosave";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "autosave";
  ALTER TABLE "_albums_v" DROP COLUMN "autosave";
  ALTER TABLE "_monthly_flyers_v" DROP COLUMN "autosave";
  ALTER TABLE "_dues_reminder_v" DROP COLUMN "autosave";`)
}
