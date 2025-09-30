-- Create canton_party_verifications table
CREATE TABLE "public"."canton_party_verifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "canton_wallet_address" text NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Primary Key
ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_pkey" PRIMARY KEY ("id");

-- Foreign Key
ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Unique constraint - one Canton address per user
ALTER TABLE ONLY "public"."canton_party_verifications"
    ADD CONSTRAINT "canton_party_verifications_user_id_unique" 
    UNIQUE ("user_id");

-- Index for performance
CREATE INDEX "canton_party_verifications_user_id_idx" 
    ON "public"."canton_party_verifications" USING "btree" ("user_id");

-- RLS Policies
ALTER TABLE "public"."canton_party_verifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own canton verification" 
    ON "public"."canton_party_verifications" 
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = "user_id");

CREATE POLICY "Users can read their own canton verification" 
    ON "public"."canton_party_verifications" 
    FOR SELECT USING ((SELECT auth.uid()) = "user_id");

-- Functions
CREATE OR REPLACE FUNCTION "public"."canton_party_verifications"("public"."profiles") 
RETURNS SETOF "public"."canton_party_verifications"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM canton_party_verifications WHERE user_id = $1.id
$_$;

ALTER FUNCTION "public"."canton_party_verifications"("public"."profiles") OWNER TO "postgres";

-- Grants
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "anon";
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."canton_party_verifications" TO "service_role";

REVOKE ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."canton_party_verifications"("public"."profiles") TO "service_role";
