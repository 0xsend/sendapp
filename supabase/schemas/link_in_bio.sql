-- Link In Bio Table
-- Stores verified social media links for user profiles with flexible do and handle structure
-- Security: Only allows trusted platforms to prevent scam/phishing links
CREATE TABLE IF NOT EXISTS "public"."link_in_bio" (
    "id" "serial" PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "handle" "text",
    "domain_name" "public"."link_in_bio_domain_names" NOT NULL,
    "domain" "text" GENERATED ALWAYS AS(
         CASE
            WHEN "domain_name" = 'X' THEN 'x.com/'
            WHEN "domain_name" = 'Instagram' THEN 'instagram.com/'
            WHEN "domain_name" = 'Discord' THEN 'discord.gg/'
            WHEN "domain_name" = 'YouTube' THEN 'youtube.com/@'
            WHEN "domain_name" = 'TikTok' THEN 'tiktok.com/@'
            WHEN "domain_name" = 'GitHub' THEN 'github.com/'
            WHEN "domain_name" = 'Telegram' THEN 't.me/'
            WHEN "domain_name" = 'Facebook' THEN 'facebook.com/'
            WHEN "domain_name" = 'OnlyFans' THEN 'onlyfans.com/'
            WHEN "domain_name" = 'WhatsApp' THEN 'wa.me/'
            WHEN "domain_name" = 'Snapchat' THEN 'snapchat.com/@'
            WHEN "domain_name" = 'Twitch' THEN 'twitch.tv/'
        ELSE NULL
    END
    ) STORED,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,

    -- Ensure one entry per user per site
    CONSTRAINT "link_in_bio_user_domain_unique" UNIQUE ("user_id", "domain_name"),

    -- Handle validation (alphanumeric + common social media characters, or NULL)
    CONSTRAINT "link_in_bio_handle_format" CHECK (
        "handle" IS NULL OR ("handle" ~ '^[a-zA-Z0-9_.-]+$' AND length("handle") BETWEEN 1 AND 100)
    )
);

-- Add table comment
COMMENT ON TABLE "public"."link_in_bio" IS 'Social media links for user profiles with domain_name and handle structure';

-- Set ownership
ALTER TABLE "public"."link_in_bio" OWNER TO "postgres";

-- Foreign Key to auth.users
ALTER TABLE ONLY "public"."link_in_bio"
    ADD CONSTRAINT "link_in_bio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX "link_in_bio_user_id_idx" ON "public"."link_in_bio" USING "btree" ("user_id");
CREATE INDEX "link_in_bio_domain_name_idx" ON "public"."link_in_bio" USING "btree" ("domain_name");
CREATE INDEX "link_in_bio_user_id_domain_name_handle_idx" ON "public"."link_in_bio" USING "btree" ("user_id","domain_name", "handle");

-- RLS
ALTER TABLE "public"."link_in_bio" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Link in bios are viewable by users who created them." ON "public"."link_in_bio"
    FOR SELECT USING ((select "auth"."uid"()) = "user_id");

CREATE POLICY "Users can insert their own link in bios." ON "public"."link_in_bio"
    FOR INSERT WITH CHECK ((select "auth"."uid"()) = "user_id");

CREATE POLICY "Users can update own link in bios." ON "public"."link_in_bio"
    FOR UPDATE USING ((select "auth"."uid"()) = "user_id");

CREATE POLICY "Users can delete own link in bios." ON "public"."link_in_bio"
    FOR DELETE USING ((select "auth"."uid"()) = "user_id");

-- Grants
GRANT ALL ON TABLE "public"."link_in_bio" TO "anon";
GRANT ALL ON TABLE "public"."link_in_bio" TO "authenticated";
GRANT ALL ON TABLE "public"."link_in_bio" TO "service_role";

-- Grant permissions on the sequence
GRANT ALL ON SEQUENCE "public"."link_in_bio_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."link_in_bio_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."link_in_bio_id_seq" TO "service_role";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION "public"."update_link_in_bio_updated_at"()
RETURNS "trigger"
LANGUAGE "plpgsql"
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_link_in_bio_updated_at"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."update_link_in_bio_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_link_in_bio_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_link_in_bio_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_link_in_bio_updated_at"() TO "service_role";

-- Trigger to automatically update updated_at
CREATE OR REPLACE TRIGGER "update_link_in_bio_updated_at_trigger"
    BEFORE UPDATE ON "public"."link_in_bio"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_link_in_bio_updated_at"();

-- Function to enable link in bios to be queried directly from profiles
-- This allows using .select('*, link_in_bio(*)') in Supabase queries
CREATE OR REPLACE FUNCTION "public"."links_in_bio"("public"."profiles") RETURNS SETOF "public"."link_in_bio"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM link_in_bio WHERE user_id = $1.id
$_$;

ALTER FUNCTION "public"."links_in_bio"("public"."profiles") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."links_in_bio"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."links_in_bio"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."links_in_bio"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."links_in_bio"("public"."profiles") TO "service_role";
