-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."sendpot_jackpot_runs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."sendpot_jackpot_runs_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."sendpot_jackpot_runs" (
    "id" integer NOT NULL,
    "chain_id" numeric,
    "log_addr" "bytea",
    "block_time" numeric,
    "tx_hash" "bytea",
    "time" numeric,
    "winner" "bytea",
    "winning_ticket" numeric,
    "win_amount" numeric,
    "tickets_purchased_total_bps" numeric,
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);
ALTER TABLE "public"."sendpot_jackpot_runs" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."sendpot_jackpot_runs_id_seq" OWNED BY "public"."sendpot_jackpot_runs"."id";
ALTER TABLE ONLY "public"."sendpot_jackpot_runs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendpot_jackpot_runs_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."sendpot_jackpot_runs"
    ADD CONSTRAINT "sendpot_jackpot_runs_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_sendpot_jackpot_runs_block_num" ON "public"."sendpot_jackpot_runs" USING "btree" ("block_num");
CREATE INDEX "sendpot_jackpot_runs_winner" ON "public"."sendpot_jackpot_runs" USING "btree" ("winner");
CREATE UNIQUE INDEX "u_sendpot_jackpot_runs" ON "public"."sendpot_jackpot_runs" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Grants
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "service_role";