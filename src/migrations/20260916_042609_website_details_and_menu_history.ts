import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum__header_v_version_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__header_v_version_secondary_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__footer_v_version_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TABLE "_club_settings_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_address" varchar DEFAULT '631 Turner Street',
    "version_city_state_zip" varchar DEFAULT 'Clearwater, FL 33756',
    "version_phone" varchar DEFAULT '(727) 461-5420',
    "version_email" varchar DEFAULT 'serenityclubclearwater@hotmail.com',
    "version_hours" varchar DEFAULT 'Open daily from 7am to 9pm.',
    "version_name" varchar DEFAULT 'Serenity Club of Clearwater' NOT NULL,
    "version_legal_name" varchar DEFAULT 'Serenity Club of Clearwater, Inc.',
    "version_tagline" varchar DEFAULT 'A safe, supportive and empowering home for the local recovery community.',
    "version_summary" varchar,
    "version_hero_image_id" integer,
    "version_hero_image_url" varchar,
    "version_about_history" varchar DEFAULT 'Serenity Club opened more than 50 years ago as a safe, sober place to go. The club was incorporated in 1993 to provide assistance, encouragement, and reassurance to people seeking recovery.',
    "version_about_welcome" varchar DEFAULT 'The clubhouse serves people irrespective of race, color, creed, or gender, and supports the moral, mental, social, and physical betterment of its members.',
    "version_about_stewardship" varchar DEFAULT 'The board and club manager steward the space, policies, events, and membership program so the clubhouse can continue serving Clearwater.',
    "version_logo_image_id" integer,
    "version_logo_image_url" varchar,
    "version_group_introduction" varchar DEFAULT 'Serenity Club hosts recovery meetings and club service work in a practical, central clubhouse space.',
    "version_facility_information" varchar DEFAULT 'Groups can reach out about meeting room use, schedule questions, special events, and service opportunities.',
    "version_small_room_information" varchar DEFAULT 'Members may request one of the small rooms for sponsor and sponsee meetings. Include your first and last name, email, phone number, requested date and time, and message.',
    "version_room_image_id" integer,
    "version_room_image_url" varchar,
    "version_sponsorship_information" varchar DEFAULT 'Club sponsors support events, supplies, and clubhouse needs. The sponsor level listed by the club starts at a $500 annual donation.',
    "version_sponsorship_contact" varchar DEFAULT 'Contact the club manager with your name, email, phone number, and sponsorship message.',
    "version_donated_items_information" varchar DEFAULT 'Drop off new and gently used donations during weekday business hours.',
    "version_office_volunteer_information" varchar DEFAULT 'Contact the coffee bar manager about office volunteer needs.',
    "version_coffee_volunteer_information" varchar DEFAULT 'Monthly coffee bar volunteer schedules are coordinated through the club manager.',
    "version_donation_url" varchar DEFAULT 'https://square.link/u/ksu7yC0P',
    "version_facebook_url" varchar DEFAULT 'https://www.facebook.com/SerenityClubofClearwater',
    "version_instagram_url" varchar,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_header_v_version_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__header_v_version_nav_items_link_type" DEFAULT 'custom',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_header_v_version_secondary_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__header_v_version_secondary_nav_items_link_type" DEFAULT 'custom',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_header_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_header_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "pages_id" integer,
    "posts_id" integer
  );

  CREATE TABLE "_footer_v_version_nav_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "link_type" "enum__footer_v_version_nav_items_link_type" DEFAULT 'custom',
    "link_new_tab" boolean,
    "link_url" varchar,
    "link_label" varchar NOT NULL,
    "_uuid" varchar
  );

  CREATE TABLE "_footer_v" (
    "id" serial PRIMARY KEY NOT NULL,
    "version_updated_at" timestamp(3) with time zone,
    "version_created_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "_footer_v_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "pages_id" integer,
    "posts_id" integer
  );

  ALTER TABLE "pages_hero_links" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "pages_blocks_cta_links" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "pages_blocks_content_columns" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "_pages_v_version_hero_links" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "_pages_v_blocks_cta_links" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "_pages_v_blocks_content_columns" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "header_secondary_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'custom';
  ALTER TABLE "products" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "_products_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
  UPDATE "products" SET "generate_slug" = false;
  UPDATE "_products_v" SET "version_generate_slug" = false;
  ALTER TABLE "club_settings" ADD COLUMN "about_history" varchar DEFAULT 'Serenity Club opened more than 50 years ago as a safe, sober place to go. The club was incorporated in 1993 to provide assistance, encouragement, and reassurance to people seeking recovery.';
  ALTER TABLE "club_settings" ADD COLUMN "about_welcome" varchar DEFAULT 'The clubhouse serves people irrespective of race, color, creed, or gender, and supports the moral, mental, social, and physical betterment of its members.';
  ALTER TABLE "club_settings" ADD COLUMN "about_stewardship" varchar DEFAULT 'The board and club manager steward the space, policies, events, and membership program so the clubhouse can continue serving Clearwater.';
  ALTER TABLE "club_settings" ADD COLUMN "group_introduction" varchar DEFAULT 'Serenity Club hosts recovery meetings and club service work in a practical, central clubhouse space.';
  ALTER TABLE "club_settings" ADD COLUMN "facility_information" varchar DEFAULT 'Groups can reach out about meeting room use, schedule questions, special events, and service opportunities.';
  ALTER TABLE "club_settings" ADD COLUMN "small_room_information" varchar DEFAULT 'Members may request one of the small rooms for sponsor and sponsee meetings. Include your first and last name, email, phone number, requested date and time, and message.';
  ALTER TABLE "club_settings" ADD COLUMN "sponsorship_information" varchar DEFAULT 'Club sponsors support events, supplies, and clubhouse needs. The sponsor level listed by the club starts at a $500 annual donation.';
  ALTER TABLE "club_settings" ADD COLUMN "sponsorship_contact" varchar DEFAULT 'Contact the club manager with your name, email, phone number, and sponsorship message.';
  ALTER TABLE "club_settings" ADD COLUMN "donated_items_information" varchar DEFAULT 'Drop off new and gently used donations during weekday business hours.';
  ALTER TABLE "club_settings" ADD COLUMN "office_volunteer_information" varchar DEFAULT 'Contact the coffee bar manager about office volunteer needs.';
  ALTER TABLE "club_settings" ADD COLUMN "coffee_volunteer_information" varchar DEFAULT 'Monthly coffee bar volunteer schedules are coordinated through the club manager.';
  ALTER TABLE "_club_settings_v" ADD CONSTRAINT "_club_settings_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_club_settings_v" ADD CONSTRAINT "_club_settings_v_version_logo_image_id_media_id_fk" FOREIGN KEY ("version_logo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_club_settings_v" ADD CONSTRAINT "_club_settings_v_version_room_image_id_media_id_fk" FOREIGN KEY ("version_room_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_header_v_version_nav_items" ADD CONSTRAINT "_header_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_v_version_secondary_nav_items" ADD CONSTRAINT "_header_v_version_secondary_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_header_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_v_rels" ADD CONSTRAINT "_header_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_header_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_v_rels" ADD CONSTRAINT "_header_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_header_v_rels" ADD CONSTRAINT "_header_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_version_nav_items" ADD CONSTRAINT "_footer_v_version_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_rels" ADD CONSTRAINT "_footer_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_footer_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_rels" ADD CONSTRAINT "_footer_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_footer_v_rels" ADD CONSTRAINT "_footer_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_club_settings_v_version_version_hero_image_idx" ON "_club_settings_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_club_settings_v_version_version_logo_image_idx" ON "_club_settings_v" USING btree ("version_logo_image_id");
  CREATE INDEX "_club_settings_v_version_version_room_image_idx" ON "_club_settings_v" USING btree ("version_room_image_id");
  CREATE INDEX "_club_settings_v_created_at_idx" ON "_club_settings_v" USING btree ("created_at");
  CREATE INDEX "_club_settings_v_updated_at_idx" ON "_club_settings_v" USING btree ("updated_at");
  CREATE INDEX "_header_v_version_nav_items_order_idx" ON "_header_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_header_v_version_nav_items_parent_id_idx" ON "_header_v_version_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_header_v_version_secondary_nav_items_order_idx" ON "_header_v_version_secondary_nav_items" USING btree ("_order");
  CREATE INDEX "_header_v_version_secondary_nav_items_parent_id_idx" ON "_header_v_version_secondary_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_header_v_created_at_idx" ON "_header_v" USING btree ("created_at");
  CREATE INDEX "_header_v_updated_at_idx" ON "_header_v" USING btree ("updated_at");
  CREATE INDEX "_header_v_rels_order_idx" ON "_header_v_rels" USING btree ("order");
  CREATE INDEX "_header_v_rels_parent_idx" ON "_header_v_rels" USING btree ("parent_id");
  CREATE INDEX "_header_v_rels_path_idx" ON "_header_v_rels" USING btree ("path");
  CREATE INDEX "_header_v_rels_pages_id_idx" ON "_header_v_rels" USING btree ("pages_id");
  CREATE INDEX "_header_v_rels_posts_id_idx" ON "_header_v_rels" USING btree ("posts_id");
  CREATE INDEX "_footer_v_version_nav_items_order_idx" ON "_footer_v_version_nav_items" USING btree ("_order");
  CREATE INDEX "_footer_v_version_nav_items_parent_id_idx" ON "_footer_v_version_nav_items" USING btree ("_parent_id");
  CREATE INDEX "_footer_v_created_at_idx" ON "_footer_v" USING btree ("created_at");
  CREATE INDEX "_footer_v_updated_at_idx" ON "_footer_v" USING btree ("updated_at");
  CREATE INDEX "_footer_v_rels_order_idx" ON "_footer_v_rels" USING btree ("order");
  CREATE INDEX "_footer_v_rels_parent_idx" ON "_footer_v_rels" USING btree ("parent_id");
  CREATE INDEX "_footer_v_rels_path_idx" ON "_footer_v_rels" USING btree ("path");
  CREATE INDEX "_footer_v_rels_pages_id_idx" ON "_footer_v_rels" USING btree ("pages_id");
  CREATE INDEX "_footer_v_rels_posts_id_idx" ON "_footer_v_rels" USING btree ("posts_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_club_settings_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_header_v_version_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_header_v_version_secondary_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_header_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_header_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footer_v_version_nav_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footer_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_footer_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_club_settings_v" CASCADE;
  DROP TABLE "_header_v_version_nav_items" CASCADE;
  DROP TABLE "_header_v_version_secondary_nav_items" CASCADE;
  DROP TABLE "_header_v" CASCADE;
  DROP TABLE "_header_v_rels" CASCADE;
  DROP TABLE "_footer_v_version_nav_items" CASCADE;
  DROP TABLE "_footer_v" CASCADE;
  DROP TABLE "_footer_v_rels" CASCADE;
  ALTER TABLE "pages_hero_links" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "pages_blocks_cta_links" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "pages_blocks_content_columns" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "_pages_v_version_hero_links" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "_pages_v_blocks_cta_links" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "_pages_v_blocks_content_columns" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "header_secondary_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference';
  ALTER TABLE "products" DROP COLUMN "generate_slug";
  ALTER TABLE "_products_v" DROP COLUMN "version_generate_slug";
  ALTER TABLE "club_settings" DROP COLUMN "about_history";
  ALTER TABLE "club_settings" DROP COLUMN "about_welcome";
  ALTER TABLE "club_settings" DROP COLUMN "about_stewardship";
  ALTER TABLE "club_settings" DROP COLUMN "group_introduction";
  ALTER TABLE "club_settings" DROP COLUMN "facility_information";
  ALTER TABLE "club_settings" DROP COLUMN "small_room_information";
  ALTER TABLE "club_settings" DROP COLUMN "sponsorship_information";
  ALTER TABLE "club_settings" DROP COLUMN "sponsorship_contact";
  ALTER TABLE "club_settings" DROP COLUMN "donated_items_information";
  ALTER TABLE "club_settings" DROP COLUMN "office_volunteer_information";
  ALTER TABLE "club_settings" DROP COLUMN "coffee_volunteer_information";
  DROP TYPE "public"."enum__header_v_version_nav_items_link_type";
  DROP TYPE "public"."enum__header_v_version_secondary_nav_items_link_type";
  DROP TYPE "public"."enum__footer_v_version_nav_items_link_type";`)
}
