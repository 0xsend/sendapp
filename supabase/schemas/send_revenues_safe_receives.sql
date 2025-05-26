-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_revenues_safe_receives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_revenues_safe_receives_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_revenues_safe_receives" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);
ALTER TABLE "public"."send_revenues_safe_receives" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_revenues_safe_receives_id_seq" OWNED BY "public"."send_revenues_safe_receives"."id";
ALTER TABLE ONLY "public"."send_revenues_safe_receives" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_revenues_safe_receives_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_revenues_safe_receives"
    ADD CONSTRAINT "send_revenues_safe_receives_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_revenues_safe_receives_block_num" ON "public"."send_revenues_safe_receives" USING "btree" ("block_num");
CREATE INDEX "send_revenues_safe_receives_block_time" ON "public"."send_revenues_safe_receives" USING "btree" ("block_time");
CREATE INDEX "send_revenues_safe_receives_sender" ON "public"."send_revenues_safe_receives" USING "btree" ("sender");
CREATE INDEX "send_revenues_safe_receives_tx_hash" ON "public"."send_revenues_safe_receives" USING "btree" ("tx_hash");
CREATE UNIQUE INDEX "u_send_revenues_safe_receives" ON "public"."send_revenues_safe_receives" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- RLS
CREATE POLICY "Send revenues safe receives can be read by the user who created" ON "public"."send_revenues_safe_receives" FOR SELECT USING ((("lower"("concat"('0x', "encode"("sender", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "chain_addresses"."address"
   FROM "public"."chain_addresses"
  WHERE ("chain_addresses"."user_id" = ( SELECT "auth"."uid"() AS "uid"))
UNION
 SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));

-- Grants
GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "anon";
GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "authenticated";
GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "service_role";