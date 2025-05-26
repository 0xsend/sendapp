-- Table
CREATE TABLE IF NOT EXISTS "public"."send_account_credentials" (
    "account_id" "uuid" NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "key_slot" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_credentials_key_slot_check" CHECK ((("key_slot" >= 0) AND ("key_slot" <= 255)))
);
ALTER TABLE "public"."send_account_credentials" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_pkey" PRIMARY KEY ("account_id", "credential_id");

-- Indexes
CREATE UNIQUE INDEX "send_account_credentials_account_id_key_slot_key" ON "public"."send_account_credentials" USING "btree" ("account_id", "key_slot");

-- Foreign Keys
ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."send_accounts"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."webauthn_credentials"("id") ON DELETE CASCADE;

-- RLS
ALTER TABLE "public"."send_account_credentials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_account_credentials" ON "public"."send_account_credentials" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));
CREATE POLICY "insert_own_account_credentials" ON "public"."send_account_credentials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));
CREATE POLICY "delete_own_account_credentials" ON "public"."send_account_credentials" FOR DELETE TO "authenticated" USING (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));

-- Grants
GRANT ALL ON TABLE "public"."send_account_credentials" TO "anon";
GRANT ALL ON TABLE "public"."send_account_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_credentials" TO "service_role";