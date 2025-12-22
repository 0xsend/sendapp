-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_check_created_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_check_created_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_check_created" (
    "id" integer NOT NULL,
    "chain_id" numeric,
    "log_addr" "bytea",
    "block_time" numeric,
    "tx_hash" "bytea",
    "tx_idx" numeric,
    "ephemeral_address" "bytea",
    "sender" "bytea",
    "token" "bytea",
    "amount" numeric,
    "expires_at" numeric,
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "log_idx" integer,
    "abi_idx" smallint
);
ALTER TABLE "public"."send_check_created" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_check_created_id_seq" OWNED BY "public"."send_check_created"."id";
ALTER TABLE ONLY "public"."send_check_created" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_check_created_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_check_created"
    ADD CONSTRAINT "send_check_created_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_send_check_created_block_num" ON "public"."send_check_created" USING "btree" ("block_num");
CREATE INDEX "idx_send_check_created_sender" ON "public"."send_check_created" USING "btree" ("sender");
CREATE INDEX "idx_send_check_created_expires_at" ON "public"."send_check_created" USING "btree" ("expires_at");
-- Composite index for JOIN conditions and get_check_by_ephemeral_address lookups
-- Replaces single-column ephemeral_address index (leading column covers that case)
CREATE INDEX "idx_send_check_created_ephemeral_chain_abi" ON "public"."send_check_created" USING "btree" ("ephemeral_address", "chain_id", "abi_idx");
CREATE UNIQUE INDEX "u_send_check_created" ON "public"."send_check_created" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- RLS
ALTER TABLE "public"."send_check_created" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon and authenticated can read send check created" ON "public"."send_check_created" FOR SELECT TO anon, authenticated USING (true);

-- Grants
GRANT ALL ON TABLE "public"."send_check_created" TO "anon";
GRANT ALL ON TABLE "public"."send_check_created" TO "authenticated";
GRANT ALL ON TABLE "public"."send_check_created" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_check_created_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_check_created_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_check_created_id_seq" TO "service_role";
