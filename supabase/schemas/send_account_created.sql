-- Send Account Created
-- This table tracks the creation of send accounts on the blockchain

-- Functions
-- Note: filter_send_account_transfers_with_no_send_account_created function is in send_account_transfers.sql
-- since it's primarily used by that table's trigger

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_account_created_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_account_created_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_account_created" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "user_op_hash" "bytea",
    "tx_hash" "bytea" NOT NULL,
    "account" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);
ALTER TABLE "public"."send_account_created" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_account_created_id_seq" OWNED BY "public"."send_account_created"."id";
ALTER TABLE ONLY "public"."send_account_created" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_created_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_account_created"
    ADD CONSTRAINT "send_account_created_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_account_created_account_block_num" ON "public"."send_account_created" USING "btree" ("block_num");
CREATE INDEX "send_account_created_account_block_time" ON "public"."send_account_created" USING "btree" ("block_time");
CREATE INDEX "shovel_account" ON "public"."send_account_created" USING "btree" ("account");
CREATE UNIQUE INDEX "u_send_account_created" ON "public"."send_account_created" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx");

-- Foreign Keys
-- None for this table

-- Triggers
-- None directly on this table

-- RLS
ALTER TABLE "public"."send_account_created" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own account created" ON "public"."send_account_created" FOR SELECT USING ((("lower"("concat"('0x', "encode"("account", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));

-- Grants
GRANT ALL ON TABLE "public"."send_account_created" TO "anon";
GRANT ALL ON TABLE "public"."send_account_created" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_created" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "service_role";