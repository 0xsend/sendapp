-- Types
-- Note: key_type_enum is already defined in types.sql and shared across tables

-- Table
CREATE TABLE IF NOT EXISTS "public"."webauthn_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "raw_credential_id" "bytea" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "public_key" "bytea" NOT NULL,
    "key_type" "public"."key_type_enum" NOT NULL,
    "sign_count" bigint NOT NULL,
    "attestation_object" "bytea" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "webauthn_credentials_sign_count_check" CHECK (("sign_count" >= 0))
);

ALTER TABLE "public"."webauthn_credentials" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE UNIQUE INDEX "webauthn_credentials_public_key" ON "public"."webauthn_credentials" USING "btree" ("public_key");
CREATE UNIQUE INDEX "webauthn_credentials_raw_credential_id" ON "public"."webauthn_credentials" USING "btree" ("raw_credential_id", "user_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."webauthn_credentials" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete_own_webauthn_credentials" ON "public"."webauthn_credentials" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

CREATE POLICY "insert_own_credentials" ON "public"."webauthn_credentials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "select_own_credentials" ON "public"."webauthn_credentials" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));

CREATE POLICY "update_own_credentials" ON "public"."webauthn_credentials" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."webauthn_credentials" TO "anon";
GRANT ALL ON TABLE "public"."webauthn_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."webauthn_credentials" TO "service_role";

-- Functions (must be created after table)
CREATE OR REPLACE FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") RETURNS SETOF "public"."webauthn_credentials"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT wc.*
    FROM auth.users AS u
    JOIN webauthn_credentials AS wc ON u.id = wc.user_id
    WHERE u.phone = phone_number;
$$;

ALTER FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") TO "service_role";