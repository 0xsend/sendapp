-- Types
CREATE TYPE "public"."canton_top_sender_result" AS (
    "avatar_url" "text",
    "name" "text",
    "send_id" integer,
    "main_tag_name" "citext",
    "tags" "citext"[],
    "canton_wallet_address" "text"
);

ALTER TYPE "public"."canton_top_sender_result" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."canton_party_verifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "canton_wallet_address" text NOT NULL,
    "is_discoverable" boolean DEFAULT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT NULL
);

ALTER TABLE "public"."canton_party_verifications" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_user_id_unique"
    UNIQUE ("user_id");

-- Indexes
CREATE INDEX "canton_party_verifications_user_id_idx"
    ON "public"."canton_party_verifications" USING "btree" ("user_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Functions
CREATE OR REPLACE FUNCTION public.canton_party_verifications(profiles)
 RETURNS canton_party_verifications  -- Single object, not SETOF
 LANGUAGE sql
 STABLE
AS $function$
SELECT * FROM canton_party_verifications WHERE user_id = $1.id LIMIT 1
$function$;

ALTER FUNCTION "public"."canton_party_verifications"("public"."profiles") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.canton_top_senders(
    page_number integer DEFAULT 0,
    page_size integer DEFAULT 10
)
RETURNS SETOF canton_top_sender_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

    RETURN QUERY
    WITH valid_users AS (
        SELECT
            p.id,
            p.name,
            p.avatar_url,
            p.send_id,
            ARRAY_AGG(t.name) AS tag_names,
            cpv.canton_wallet_address
        FROM canton_party_verifications cpv
        INNER JOIN profiles p ON p.id = cpv.user_id
        INNER JOIN tags t ON t.user_id = p.id
        WHERE p.is_public = TRUE
          AND t.status = 'confirmed'
          AND cpv.is_discoverable = TRUE
        GROUP BY p.id, p.name, p.avatar_url, p.send_id, cpv.canton_wallet_address
    ),
    user_scores AS (
        SELECT
            ss.user_id,
            COALESCE(SUM(ss.score), 0) AS send_score
        FROM send_scores ss
        WHERE ss.user_id IN (SELECT id FROM valid_users)
        GROUP BY ss.user_id
        HAVING COALESCE(SUM(ss.score), 0) > 0
    )
    SELECT
        vu.avatar_url,
        vu.name,
        vu.send_id,
        main_tag.name AS main_tag_name,
        vu.tag_names,
        vu.canton_wallet_address
    FROM valid_users vu
    INNER JOIN user_scores us ON us.user_id = vu.id
    LEFT JOIN send_accounts sa ON sa.user_id = vu.id
    LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
    ORDER BY us.send_score DESC
    LIMIT page_size
    OFFSET page_number * page_size;
END;
$function$;

ALTER FUNCTION "public"."canton_top_senders"(integer, integer) OWNER TO "postgres";

-- RLS
ALTER TABLE "public"."canton_party_verifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own canton verification"
    ON "public"."canton_party_verifications"
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can read their own canton verification"
    ON "public"."canton_party_verifications"
    FOR SELECT USING ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can update their own canton verification"
    ON "public"."canton_party_verifications"
    FOR UPDATE
    USING ((SELECT auth.uid()) = "user_id")
    WITH CHECK ((SELECT auth.uid()) = "user_id");

-- Grants
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "anon";
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "service_role";

REVOKE ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "service_role";

-- Grant public access to canton_top_senders function (used directly via Supabase API)
REVOKE ALL ON FUNCTION "public"."canton_top_senders"(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."canton_top_senders"(integer, integer) TO "service_role";

-- Grant type access for anon users
REVOKE USAGE ON TYPE "public"."canton_top_sender_result" FROM PUBLIC;
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "anon";
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "authenticated";
GRANT USAGE ON TYPE "public"."canton_top_sender_result" TO "service_role";
