import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_albums_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__albums_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "albums" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"date" varchar,
  	"description" varchar,
  	"cover_id" integer,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_albums_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_albums_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_date" varchar,
  	"version_description" varchar,
  	"version_cover_id" integer,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_order" numeric DEFAULT 100,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__albums_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "gallery_items" ADD COLUMN "album_id" integer;
  ALTER TABLE "_gallery_items_v" ADD COLUMN "version_album_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "albums_id" integer;
  ALTER TABLE "albums" ADD CONSTRAINT "albums_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_albums_v" ADD CONSTRAINT "_albums_v_parent_id_albums_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_albums_v" ADD CONSTRAINT "_albums_v_version_cover_id_media_id_fk" FOREIGN KEY ("version_cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "albums_cover_idx" ON "albums" USING btree ("cover_id");
  CREATE UNIQUE INDEX "albums_slug_idx" ON "albums" USING btree ("slug");
  CREATE INDEX "albums_updated_at_idx" ON "albums" USING btree ("updated_at");
  CREATE INDEX "albums_created_at_idx" ON "albums" USING btree ("created_at");
  CREATE INDEX "albums__status_idx" ON "albums" USING btree ("_status");
  CREATE INDEX "_albums_v_parent_idx" ON "_albums_v" USING btree ("parent_id");
  CREATE INDEX "_albums_v_version_version_cover_idx" ON "_albums_v" USING btree ("version_cover_id");
  CREATE INDEX "_albums_v_version_version_slug_idx" ON "_albums_v" USING btree ("version_slug");
  CREATE INDEX "_albums_v_version_version_updated_at_idx" ON "_albums_v" USING btree ("version_updated_at");
  CREATE INDEX "_albums_v_version_version_created_at_idx" ON "_albums_v" USING btree ("version_created_at");
  CREATE INDEX "_albums_v_version_version__status_idx" ON "_albums_v" USING btree ("version__status");
  CREATE INDEX "_albums_v_created_at_idx" ON "_albums_v" USING btree ("created_at");
  CREATE INDEX "_albums_v_updated_at_idx" ON "_albums_v" USING btree ("updated_at");
  CREATE INDEX "_albums_v_latest_idx" ON "_albums_v" USING btree ("latest");
  ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_gallery_items_v" ADD CONSTRAINT "_gallery_items_v_version_album_id_albums_id_fk" FOREIGN KEY ("version_album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_albums_fk" FOREIGN KEY ("albums_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "gallery_items_album_idx" ON "gallery_items" USING btree ("album_id");
  CREATE INDEX "_gallery_items_v_version_version_album_idx" ON "_gallery_items_v" USING btree ("version_album_id");
  CREATE INDEX "payload_locked_documents_rels_albums_id_idx" ON "payload_locked_documents_rels" USING btree ("albums_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "albums" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_albums_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "gallery_items" DROP CONSTRAINT "gallery_items_album_id_albums_id_fk";
  
  ALTER TABLE "_gallery_items_v" DROP CONSTRAINT "_gallery_items_v_version_album_id_albums_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_albums_fk";
  
  DROP INDEX "gallery_items_album_idx";
  DROP INDEX "_gallery_items_v_version_version_album_idx";
  DROP INDEX "payload_locked_documents_rels_albums_id_idx";
  ALTER TABLE "gallery_items" DROP COLUMN "album_id";
  ALTER TABLE "_gallery_items_v" DROP COLUMN "version_album_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "albums_id";
  DROP TABLE "_albums_v" CASCADE;
  DROP TABLE "albums" CASCADE;
  DROP TYPE "public"."enum_albums_status";
  DROP TYPE "public"."enum__albums_v_version_status";`)
}
