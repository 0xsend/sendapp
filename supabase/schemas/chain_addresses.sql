-- Functions
CREATE OR REPLACE FUNCTION "public"."chain_addresses_after_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create addresses for themselves';

END IF;

IF (
    SELECT COUNT(*)
    FROM public.chain_addresses
    WHERE user_id = NEW.user_id
        AND TG_OP = 'INSERT'
) > 1 THEN RAISE EXCEPTION 'User can have at most 1 address';

END IF;

RETURN NEW;

END;

$$;

ALTER FUNCTION "public"."chain_addresses_after_insert"() OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."chain_addresses" (
    "address" "public"."citext" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chain_addresses_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")))
);

ALTER TABLE "public"."chain_addresses" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."chain_addresses"
    ADD CONSTRAINT "chain_addresses_pkey" PRIMARY KEY ("address");

-- Indexes
CREATE INDEX "chain_addresses_user_id_idx" ON "public"."chain_addresses" USING "btree" ("user_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."chain_addresses"
    ADD CONSTRAINT "chain_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "trigger_chain_addresses_after_insert" AFTER INSERT OR UPDATE ON "public"."chain_addresses" FOR EACH ROW EXECUTE FUNCTION "public"."chain_addresses_after_insert"();

-- RLS
ALTER TABLE "public"."chain_addresses" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Addresses are viewable by users who created them." ON "public"."chain_addresses" FOR SELECT USING (("auth"."uid"() = "user_id"));

-- Grants
REVOKE ALL ON FUNCTION "public"."chain_addresses_after_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "service_role";

GRANT ALL ON TABLE "public"."chain_addresses" TO "anon";
GRANT ALL ON TABLE "public"."chain_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."chain_addresses" TO "service_role";