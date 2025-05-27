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

-- RLS
ALTER TABLE "public"."sendpot_user_ticket_purchases" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see their own ticket purchases" ON "public"."sendpot_user_ticket_purchases" FOR SELECT USING ((("lower"("concat"('0x', "encode"("recipient", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "sa"."address"
   FROM "public"."send_accounts" "sa"
  WHERE ("sa"."user_id" = "auth"."uid"()))));

-- Grants
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "service_role";

-- Functions

CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    pending_tickets_sum numeric;
BEGIN
    WITH recent_run AS (
        -- Get the most recent jackpot run
        SELECT block_num
        FROM public.sendpot_jackpot_runs
        ORDER BY block_num DESC
        LIMIT 1
    )
    SELECT COALESCE(SUM(tickets_purchased_total_bps), 0)
    INTO pending_tickets_sum
    FROM public.sendpot_user_ticket_purchases
    WHERE block_num > COALESCE((SELECT block_num FROM recent_run), 0);

    RETURN pending_tickets_sum;
END;
$function$
;

ALTER FUNCTION "public"."get_pending_jackpot_tickets_purchased"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "service_role";
