-- Table to track historical feeBps changes for the Sendpot contract
-- This allows accurate ticket calculation based on the fee at time of purchase

CREATE TABLE IF NOT EXISTS "public"."sendpot_fee_history" (
    "id" bigserial PRIMARY KEY,
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" bytea,
    "fee_bps" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE "public"."sendpot_fee_history" OWNER TO "postgres";

-- Index for efficient lookups by block number
CREATE INDEX "idx_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");

-- Unique constraint to prevent duplicate entries for the same block
CREATE UNIQUE INDEX "u_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");

-- RLS: This is read-only reference data, allow all authenticated users to read
ALTER TABLE "public"."sendpot_fee_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_history_select_policy" ON "public"."sendpot_fee_history" FOR SELECT USING (true);

-- Grants
GRANT SELECT ON TABLE "public"."sendpot_fee_history" TO "anon";
GRANT SELECT ON TABLE "public"."sendpot_fee_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_fee_history" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."sendpot_fee_history_id_seq" TO "service_role";
