-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_token_v0_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_token_v0_transfers_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_token_v0_transfers" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "f" "bytea" NOT NULL,
    "t" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);
ALTER TABLE "public"."send_token_v0_transfers" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_token_v0_transfers_id_seq" OWNED BY "public"."send_token_v0_transfers"."id";
ALTER TABLE ONLY "public"."send_token_v0_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_token_v0_transfers_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_token_v0_transfers"
    ADD CONSTRAINT "send_token_v0_transfers_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_token_v0_transfers_block_num" ON "public"."send_token_v0_transfers" USING "btree" ("block_num");
CREATE INDEX "send_token_v0_transfers_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("block_time");
CREATE INDEX "send_token_v0_transfers_composite" ON "public"."send_token_v0_transfers" USING "btree" ("block_time", "f", "t", "v");
CREATE INDEX "send_token_v0_transfers_f" ON "public"."send_token_v0_transfers" USING "btree" ("f");
CREATE INDEX "send_token_v0_transfers_t" ON "public"."send_token_v0_transfers" USING "btree" ("t");
CREATE UNIQUE INDEX "u_send_token_v0_transfers" ON "public"."send_token_v0_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Grants
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "service_role";