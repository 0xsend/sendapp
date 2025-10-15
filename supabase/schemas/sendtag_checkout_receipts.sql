-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."sendtag_checkout_receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."sendtag_checkout_receipts_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."sendtag_checkout_receipts" (
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text") || '/'::"text") || ("abi_idx")::"text")) STORED NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "amount" numeric NOT NULL,
    "referrer" "bytea" NOT NULL,
    "reward" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL
);
ALTER TABLE "public"."sendtag_checkout_receipts" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."sendtag_checkout_receipts_id_seq" OWNED BY "public"."sendtag_checkout_receipts"."id";
ALTER TABLE ONLY "public"."sendtag_checkout_receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendtag_checkout_receipts_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."sendtag_checkout_receipts"
    ADD CONSTRAINT "sendtag_checkout_receipts_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_sendtag_receipts" ON "public"."sendtag_checkout_receipts" USING "btree" ("amount", "reward");
CREATE INDEX "sendtag_checkout_receipts_block_num" ON "public"."sendtag_checkout_receipts" USING "btree" ("block_num");
CREATE INDEX "sendtag_checkout_receipts_block_time" ON "public"."sendtag_checkout_receipts" USING "btree" ("block_time");
CREATE INDEX "sendtag_checkout_receipts_sender_idx" ON "public"."sendtag_checkout_receipts" USING "btree" ("sender");
CREATE UNIQUE INDEX "u_sendtag_checkout_receipts" ON "public"."sendtag_checkout_receipts" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Triggers
CREATE OR REPLACE TRIGGER "update_leaderboard_referrals_all_time_sendtag_checkout_receipts" AFTER INSERT ON "public"."sendtag_checkout_receipts" FOR EACH ROW EXECUTE FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"();

-- RLS
ALTER TABLE "public"."sendtag_checkout_receipts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see their own sendtag_checkout_receipts" ON "public"."sendtag_checkout_receipts" FOR SELECT USING (("sender" = ANY ( SELECT "send_accounts"."address_bytes"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));

-- Grants
GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "anon";
GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "service_role";