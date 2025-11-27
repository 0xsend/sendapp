CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN

RETURN substr(md5(random()::text), 0, 12);

END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."generate_referral_code"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";




CREATE SEQUENCE IF NOT EXISTS "public"."profiles_send_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."profiles_send_id_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "name" "text",
    "about" "text",
    "referral_code" "text" DEFAULT "public"."generate_referral_code"(),
    "is_public" boolean DEFAULT true,
    "send_id" integer DEFAULT "nextval"('"public"."profiles_send_id_seq"'::"regclass") NOT NULL,
    "x_username" "text",
    "birthday" "date",
    "banner_url" "text",
    "verified_at" timestamp with time zone DEFAULT NULL,
    CONSTRAINT "profiles_about_update" CHECK (("length"("about") < 255)),
    CONSTRAINT "profiles_name_update" CHECK (("length"("name") < 63)),
    CONSTRAINT "profiles_x_username_update" CHECK (("length"("x_username") <= 64))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");

-- Indexes
CREATE INDEX "profiles_send_id_idx" ON "public"."profiles" USING "btree" ("send_id");
-- Partial covering index for top_senders query: filters and includes all selected columns
CREATE INDEX "profiles_public_avatar_idx" ON "public"."profiles" USING "btree" ("id", "name", "avatar_url", "send_id") WHERE "is_public" = TRUE AND "avatar_url" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "profiles_verified_at_idx" ON "public"."profiles" ("verified_at") WHERE "verified_at" IS NOT NULL;

-- Foreign Keys
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by users who created them." ON "public"."profiles" FOR SELECT USING (((SELECT auth.uid()) = "id"));

CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (((SELECT auth.uid()) = "id"));

CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (((SELECT auth.uid()) = "id"));

-- Grants
GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ begin
insert into public.profiles (id)
values (new.id);

return new;

end;

$$;

ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

CREATE OR REPLACE FUNCTION public.stop_change_send_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$
;
ALTER FUNCTION "public"."stop_change_send_id"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."stop_change_send_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "service_role";

-- Functions for verified_at sync
CREATE OR REPLACE FUNCTION public.update_profile_verified_at_on_share_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only update if inserting a share for the current distribution
    IF curr_distribution_id IS NOT NULL AND NEW.distribution_id = curr_distribution_id THEN
        UPDATE profiles
        SET verified_at = NOW()
        WHERE id = NEW.user_id
          AND verified_at IS NULL;
    END IF;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."update_profile_verified_at_on_share_insert"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."update_profile_verified_at_on_share_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_insert"() TO "service_role";

CREATE OR REPLACE FUNCTION public.update_profile_verified_at_on_share_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- No-op: once verified, always verified
    -- We don't clear verified_at when shares are deleted
    RETURN OLD;
END;
$function$;

ALTER FUNCTION "public"."update_profile_verified_at_on_share_delete"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."update_profile_verified_at_on_share_delete"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_delete"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_verified_at_on_share_delete"() TO "service_role";

CREATE OR REPLACE FUNCTION public.refresh_profile_verification_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only set verified_at for users with shares in current distribution
    -- Never clear verified_at - once verified, always verified
    IF curr_distribution_id IS NOT NULL THEN
        UPDATE profiles
        SET verified_at = NOW()
        WHERE id IN (
            SELECT DISTINCT user_id
            FROM distribution_shares
            WHERE distribution_id = curr_distribution_id
        )
        AND verified_at IS NULL;
    END IF;
END;
$function$;

ALTER FUNCTION "public"."refresh_profile_verification_status"() OWNER TO "postgres";
-- service_role ONLY: This function can reset all verification status and should not be callable by clients
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM anon;
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."refresh_profile_verification_status"() TO "service_role";

CREATE OR REPLACE FUNCTION "public"."cleanup_referral_verifications_on_user_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    current_dist_id integer;
BEGIN
    -- Get current distribution (active qualification period)
    SELECT id INTO current_dist_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only proceed if there's an active distribution
    IF current_dist_id IS NOT NULL THEN
        -- Set weight to 0 for tag_referral verifications in current distribution
        -- where the deleted user was the referred user
        UPDATE distribution_verifications dv
        SET weight = 0
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'tag_referral'
          AND (dv.metadata->>'referred_id')::uuid = OLD.id;

        -- Recalculate total_tag_referrals for affected referrers
        -- in current distribution
        -- Match update_referral_verifications logic: only count referrals
        -- who have distribution_shares in CURRENT distribution
        WITH affected_referrers AS (
            SELECT DISTINCT r.referrer_id
            FROM referrals r
            WHERE r.referred_id = OLD.id
        ),
        referral_counts AS (
            SELECT
                r.referrer_id,
                COUNT(*) FILTER (
                    WHERE r.referred_id != OLD.id
                    AND EXISTS (
                        SELECT 1
                        FROM distribution_shares ds
                        WHERE ds.user_id = r.referred_id
                        AND ds.distribution_id = current_dist_id
                        AND ds.amount > 0
                    )
                ) as new_count
            FROM referrals r
            WHERE r.referrer_id IN (SELECT referrer_id FROM affected_referrers)
            GROUP BY r.referrer_id
        )
        UPDATE distribution_verifications dv
        SET weight = COALESCE(rc.new_count, 0)
        FROM referral_counts rc
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'total_tag_referrals'
          AND dv.user_id = rc.referrer_id;
    END IF;

    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."cleanup_referral_verifications_on_user_delete"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."cleanup_referral_verifications_on_user_delete"() FROM PUBLIC;
-- No grants needed - only used by trigger

-- Triggers
CREATE OR REPLACE TRIGGER "avoid_send_id_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."stop_change_send_id"();
