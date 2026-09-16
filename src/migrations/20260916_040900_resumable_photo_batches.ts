import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_photo_batches_state" AS ENUM('reviewing', 'published');
  CREATE TYPE "public"."enum_photo_batch_items_status" AS ENUM('pending', 'ready', 'error', 'excluded', 'published');
  CREATE TABLE "photo_batches" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "date" varchar,
    "album_id" integer,
    "album_revision" varchar,
    "cover_id" integer,
    "created_by_id" integer,
    "revision" numeric DEFAULT 0 NOT NULL,
    "state" "enum_photo_batches_state" DEFAULT 'reviewing' NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "photo_batch_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "batch_id" integer NOT NULL,
    "key" varchar NOT NULL,
    "fingerprint" varchar NOT NULL,
    "filename" varchar NOT NULL,
    "title" varchar NOT NULL,
    "caption" varchar,
    "alt" varchar,
    "position" numeric NOT NULL,
    "status" "enum_photo_batch_items_status" DEFAULT 'pending' NOT NULL,
    "error" varchar,
    "receipt" jsonb,
    "media_id" integer,
    "photo_revision" varchar,
    "photo_id" integer,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "gallery_items" ADD COLUMN "import_key" varchar;
  ALTER TABLE "gallery_items" ADD COLUMN "taken_on" varchar;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_import_key" varchar;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_taken_on" varchar;
  ALTER TABLE "media" ADD COLUMN "content_hash" varchar;
  ALTER TABLE "media" ADD COLUMN "upload_key" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "photo_batches_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "photo_batch_items_id" integer;
  ALTER TABLE "photo_batches" ADD CONSTRAINT "photo_batches_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_batches" ADD CONSTRAINT "photo_batches_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_batches" ADD CONSTRAINT "photo_batches_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_batch_items" ADD CONSTRAINT "photo_batch_items_batch_id_photo_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."photo_batches"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_batch_items" ADD CONSTRAINT "photo_batch_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "photo_batch_items" ADD CONSTRAINT "photo_batch_items_photo_id_gallery_items_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."gallery_items"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "photo_batches_album_idx" ON "photo_batches" USING btree ("album_id");
  CREATE INDEX "photo_batches_cover_idx" ON "photo_batches" USING btree ("cover_id");
  CREATE INDEX "photo_batches_created_by_idx" ON "photo_batches" USING btree ("created_by_id");
  CREATE INDEX "photo_batches_updated_at_idx" ON "photo_batches" USING btree ("updated_at");
  CREATE INDEX "photo_batches_created_at_idx" ON "photo_batches" USING btree ("created_at");
  CREATE INDEX "photo_batch_items_batch_idx" ON "photo_batch_items" USING btree ("batch_id");
  CREATE UNIQUE INDEX "photo_batch_items_key_idx" ON "photo_batch_items" USING btree ("key");
  CREATE INDEX "photo_batch_items_media_idx" ON "photo_batch_items" USING btree ("media_id");
  CREATE UNIQUE INDEX "photo_batch_items_photo_idx" ON "photo_batch_items" USING btree ("photo_id");
  CREATE INDEX "photo_batch_items_updated_at_idx" ON "photo_batch_items" USING btree ("updated_at");
  CREATE INDEX "photo_batch_items_created_at_idx" ON "photo_batch_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "batch_fingerprint_idx" ON "photo_batch_items" USING btree ("batch_id","fingerprint");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photo_batches_fk" FOREIGN KEY ("photo_batches_id") REFERENCES "public"."photo_batches"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_photo_batch_items_fk" FOREIGN KEY ("photo_batch_items_id") REFERENCES "public"."photo_batch_items"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "gallery_items_import_key_idx" ON "gallery_items" USING btree ("import_key");
  CREATE INDEX "_gallery_items_v_version_version_import_key_idx" ON "_gallery_items_v" USING btree ("version_import_key");
  CREATE INDEX "media_content_hash_idx" ON "media" USING btree ("content_hash");
  CREATE UNIQUE INDEX "media_upload_key_idx" ON "media" USING btree ("upload_key");
  CREATE INDEX "payload_locked_documents_rels_photo_batches_id_idx" ON "payload_locked_documents_rels" USING btree ("photo_batches_id");
  CREATE INDEX "payload_locked_documents_rels_photo_batch_items_id_idx" ON "payload_locked_documents_rels" USING btree ("photo_batch_items_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "photo_batches" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "photo_batch_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photo_batches_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_photo_batch_items_fk";

  DROP INDEX "gallery_items_import_key_idx";
  DROP INDEX "_gallery_items_v_version_version_import_key_idx";
  DROP INDEX "media_content_hash_idx";
  DROP INDEX "media_upload_key_idx";
  DROP INDEX "payload_locked_documents_rels_photo_batches_id_idx";
  DROP INDEX "payload_locked_documents_rels_photo_batch_items_id_idx";
  ALTER TABLE "gallery_items" DROP COLUMN "import_key";
  ALTER TABLE "gallery_items" DROP COLUMN "taken_on";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_import_key";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_taken_on";
  ALTER TABLE "media" DROP COLUMN "content_hash";
  ALTER TABLE "media" DROP COLUMN "upload_key";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "photo_batches_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "photo_batch_items_id";
  DROP TABLE "photo_batches" CASCADE;
  DROP TABLE "photo_batch_items" CASCADE;
  DROP TYPE "public"."enum_photo_batches_state";
  DROP TYPE "public"."enum_photo_batch_items_status";`)
}
