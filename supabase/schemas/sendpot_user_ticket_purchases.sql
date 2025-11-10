-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."sendpot_user_ticket_purchases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."sendpot_user_ticket_purchases_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."sendpot_user_ticket_purchases" (
    "id" integer NOT NULL,
    "chain_id" numeric,
    "log_addr" "bytea",
    "block_time" numeric,
    "tx_hash" "bytea",
    "referrer" "bytea",
    "value" numeric,
    "recipient" "bytea",
    "buyer" "bytea",
    "tickets_purchased_total_bps" numeric,
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);
ALTER TABLE "public"."sendpot_user_ticket_purchases" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" OWNED BY "public"."sendpot_user_ticket_purchases"."id";
ALTER TABLE ONLY "public"."sendpot_user_ticket_purchases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendpot_user_ticket_purchases_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."sendpot_user_ticket_purchases"
    ADD CONSTRAINT "sendpot_user_ticket_purchases_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_sendpot_user_ticket_purchases_block_num" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("block_num");
CREATE INDEX "sendpot_user_ticket_purchases_buyer" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("buyer");
CREATE INDEX "sendpot_user_ticket_purchases_recipient" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("recipient");
CREATE INDEX "sendpot_user_ticket_purchases_referrer" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("referrer");
CREATE UNIQUE INDEX "u_sendpot_user_ticket_purchases" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE INDEX "idx_sendpot_user_ticket_purchases_buyer_block_time" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("buyer", "block_time");
CREATE INDEX "idx_sendpot_user_ticket_purchases_block_time" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("block_time");

-- RLS
ALTER TABLE "public"."sendpot_user_ticket_purchases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see their own ticket purchases" ON "public"."sendpot_user_ticket_purchases" FOR SELECT USING (EXISTS (
  SELECT 1 FROM "public"."send_accounts" "sa"
  WHERE "sa"."user_id" = (SELECT auth.uid())
    AND "sa"."address_bytes" = "sendpot_user_ticket_purchases"."recipient"
));

-- Grants
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "service_role";

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_sendpot_ticket_purchase" AFTER INSERT ON "public"."sendpot_user_ticket_purchases" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sendpot_ticket_purchase"();
