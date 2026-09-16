import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_monthly_flyers_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__monthly_flyers_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "source_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sha256" varchar,
  	"prefix" varchar DEFAULT '',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "monthly_flyers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"month" varchar,
  	"image_id" integer,
  	"source_document_id" integer,
  	"details" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_monthly_flyers_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_monthly_flyers_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_month" varchar,
  	"version_image_id" integer,
  	"version_source_document_id" integer,
  	"version_details" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__monthly_flyers_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "media" ADD COLUMN "source_document_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "source_documents_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "monthly_flyers_id" integer;
  ALTER TABLE "monthly_flyers" ADD CONSTRAINT "monthly_flyers_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "monthly_flyers" ADD CONSTRAINT "monthly_flyers_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_monthly_flyers_v" ADD CONSTRAINT "_monthly_flyers_v_parent_id_monthly_flyers_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."monthly_flyers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_monthly_flyers_v" ADD CONSTRAINT "_monthly_flyers_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_monthly_flyers_v" ADD CONSTRAINT "_monthly_flyers_v_version_source_document_id_source_documents_id_fk" FOREIGN KEY ("version_source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "source_documents_updated_at_idx" ON "source_documents" USING btree ("updated_at");
  CREATE INDEX "source_documents_created_at_idx" ON "source_documents" USING btree ("created_at");
  CREATE UNIQUE INDEX "source_documents_filename_idx" ON "source_documents" USING btree ("filename");
  CREATE UNIQUE INDEX "monthly_flyers_month_idx" ON "monthly_flyers" USING btree ("month");
  CREATE INDEX "monthly_flyers_image_idx" ON "monthly_flyers" USING btree ("image_id");
  CREATE INDEX "monthly_flyers_source_document_idx" ON "monthly_flyers" USING btree ("source_document_id");
  CREATE INDEX "monthly_flyers_updated_at_idx" ON "monthly_flyers" USING btree ("updated_at");
  CREATE INDEX "monthly_flyers_created_at_idx" ON "monthly_flyers" USING btree ("created_at");
  CREATE INDEX "monthly_flyers__status_idx" ON "monthly_flyers" USING btree ("_status");
  CREATE INDEX "_monthly_flyers_v_parent_idx" ON "_monthly_flyers_v" USING btree ("parent_id");
  CREATE INDEX "_monthly_flyers_v_version_version_month_idx" ON "_monthly_flyers_v" USING btree ("version_month");
  CREATE INDEX "_monthly_flyers_v_version_version_image_idx" ON "_monthly_flyers_v" USING btree ("version_image_id");
  CREATE INDEX "_monthly_flyers_v_version_version_source_document_idx" ON "_monthly_flyers_v" USING btree ("version_source_document_id");
  CREATE INDEX "_monthly_flyers_v_version_version_updated_at_idx" ON "_monthly_flyers_v" USING btree ("version_updated_at");
  CREATE INDEX "_monthly_flyers_v_version_version_created_at_idx" ON "_monthly_flyers_v" USING btree ("version_created_at");
  CREATE INDEX "_monthly_flyers_v_version_version__status_idx" ON "_monthly_flyers_v" USING btree ("version__status");
  CREATE INDEX "_monthly_flyers_v_created_at_idx" ON "_monthly_flyers_v" USING btree ("created_at");
  CREATE INDEX "_monthly_flyers_v_updated_at_idx" ON "_monthly_flyers_v" USING btree ("updated_at");
  CREATE INDEX "_monthly_flyers_v_latest_idx" ON "_monthly_flyers_v" USING btree ("latest");
  ALTER TABLE "media" ADD CONSTRAINT "media_source_document_id_source_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."source_documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_source_documents_fk" FOREIGN KEY ("source_documents_id") REFERENCES "public"."source_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_monthly_flyers_fk" FOREIGN KEY ("monthly_flyers_id") REFERENCES "public"."monthly_flyers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "media_source_document_idx" ON "media" USING btree ("source_document_id");
  CREATE INDEX "payload_locked_documents_rels_source_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("source_documents_id");
  CREATE INDEX "payload_locked_documents_rels_monthly_flyers_id_idx" ON "payload_locked_documents_rels" USING btree ("monthly_flyers_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "source_documents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "monthly_flyers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_monthly_flyers_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "source_documents" CASCADE;
  DROP TABLE "monthly_flyers" CASCADE;
  DROP TABLE "_monthly_flyers_v" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_source_document_id_source_documents_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_source_documents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_monthly_flyers_fk";
  
  DROP INDEX "media_source_document_idx";
  DROP INDEX "payload_locked_documents_rels_source_documents_id_idx";
  DROP INDEX "payload_locked_documents_rels_monthly_flyers_id_idx";
  ALTER TABLE "media" DROP COLUMN "source_document_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "source_documents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "monthly_flyers_id";
  DROP TYPE "public"."enum_monthly_flyers_status";
  DROP TYPE "public"."enum__monthly_flyers_v_version_status";`)
}
