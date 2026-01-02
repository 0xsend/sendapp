-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_check_claimed_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_check_claimed_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_check_claimed" (
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
    "redeemer" "bytea",
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "log_idx" integer,
    "abi_idx" smallint
);
ALTER TABLE "public"."send_check_claimed" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_check_claimed_id_seq" OWNED BY "public"."send_check_claimed"."id";
ALTER TABLE ONLY "public"."send_check_claimed" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_check_claimed_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_check_claimed"
    ADD CONSTRAINT "send_check_claimed_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_send_check_claimed_block_num" ON "public"."send_check_claimed" USING "btree" ("block_num");
CREATE INDEX "idx_send_check_claimed_sender" ON "public"."send_check_claimed" USING "btree" ("sender");
CREATE INDEX "idx_send_check_claimed_redeemer" ON "public"."send_check_claimed" USING "btree" ("redeemer");
-- Composite index for JOIN conditions from send_check_created table
-- Replaces single-column ephemeral_address index (leading column covers that case)
CREATE INDEX "idx_send_check_claimed_ephemeral_chain_abi" ON "public"."send_check_claimed" USING "btree" ("ephemeral_address", "chain_id", "abi_idx");
CREATE UNIQUE INDEX "u_send_check_claimed" ON "public"."send_check_claimed" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Performance indexes for send_scores queries (Phase 1 optimizations)
-- Composite index covering the most common query pattern for send_scores
-- Covers: token filter + time range + sender/redeemer lookups
CREATE INDEX "idx_send_check_claimed_scores_composite" ON "public"."send_check_claimed" USING "btree" ("token", "block_time", "sender", "redeemer") WHERE ("redeemer" != "sender");

-- Partial index specifically for SEND token (most common case)
-- Smaller and faster than composite index when querying only SEND token
CREATE INDEX "idx_send_check_claimed_send_token_only" ON "public"."send_check_claimed" USING "btree" ("block_time" DESC, "sender", "redeemer") WHERE (("token" = '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea) AND ("redeemer" != "sender"));

-- Index for efficient verification lookups (redeemer-based queries)
CREATE INDEX "idx_send_check_claimed_redeemer_time" ON "public"."send_check_claimed" USING "btree" ("redeemer", "block_time", "token") WHERE ("redeemer" != "sender");

-- RLS
ALTER TABLE "public"."send_check_claimed" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon and authenticated can read send check claimed" ON "public"."send_check_claimed" FOR SELECT TO anon, authenticated USING (true);

-- Grants
GRANT ALL ON TABLE "public"."send_check_claimed" TO "anon";
GRANT ALL ON TABLE "public"."send_check_claimed" TO "authenticated";
GRANT ALL ON TABLE "public"."send_check_claimed" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_check_claimed_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_check_claimed_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_check_claimed_id_seq" TO "service_role";
