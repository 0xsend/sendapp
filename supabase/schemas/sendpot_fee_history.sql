-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."sendpot_fee_history_id_seq"
    AS bigint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."sendpot_fee_history_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."sendpot_fee_history" (
    "id" bigint NOT NULL,
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea",
    "fee_bps" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE "public"."sendpot_fee_history" OWNER TO "postgres";

COMMENT ON TABLE "public"."sendpot_fee_history" IS 'Historical feeBps values for the Sendpot contract. Fee increased from 3000 to 7000 at block 38567474.';

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."sendpot_fee_history_id_seq" OWNED BY "public"."sendpot_fee_history"."id";
ALTER TABLE ONLY "public"."sendpot_fee_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendpot_fee_history_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."sendpot_fee_history"
    ADD CONSTRAINT "sendpot_fee_history_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");
CREATE UNIQUE INDEX "u_sendpot_fee_history_block_num" ON "public"."sendpot_fee_history" USING "btree" ("block_num");

-- RLS
ALTER TABLE "public"."sendpot_fee_history" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read fee history" ON "public"."sendpot_fee_history" FOR SELECT TO "authenticated" USING (true);

-- Grants
GRANT ALL ON TABLE "public"."sendpot_fee_history" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_fee_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_fee_history" TO "service_role";

GRANT USAGE ON SEQUENCE "public"."sendpot_fee_history_id_seq" TO "service_role";

-- Functions

-- Function to get the feeBps at a specific block
CREATE OR REPLACE FUNCTION public.get_fee_bps_at_block(target_block_num numeric)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    fee numeric;
    BASE_TICKET_BPS constant numeric := 10000;
    DEFAULT_FEE_BPS constant numeric := 7000;
BEGIN
    SELECT fee_bps INTO fee
    FROM sendpot_fee_history
    WHERE block_num <= target_block_num
    ORDER BY block_num DESC
    LIMIT 1;

    IF fee IS NULL THEN
        fee := DEFAULT_FEE_BPS;
    END IF;

    RETURN fee;
END;
$function$;

ALTER FUNCTION "public"."get_fee_bps_at_block"(numeric) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."get_fee_bps_at_block" IS 'Returns the feeBps value that was active at the specified block number';

REVOKE ALL ON FUNCTION "public"."get_fee_bps_at_block"(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."get_fee_bps_at_block"(numeric) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_fee_bps_at_block"(numeric) TO "service_role";

-- Function to calculate tickets from BPS using historical fee
CREATE OR REPLACE FUNCTION public.calculate_tickets_from_bps_with_fee(
    bps_delta numeric,
    block_num numeric
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
    fee_bps numeric;
    net_bps_per_ticket numeric;
    BASE_TICKET_BPS constant numeric := 10000;
BEGIN
    IF bps_delta <= 0 THEN
        RETURN 0;
    END IF;

    fee_bps := get_fee_bps_at_block(block_num);
    net_bps_per_ticket := BASE_TICKET_BPS - fee_bps;

    IF net_bps_per_ticket <= 0 THEN
        RAISE EXCEPTION 'Invalid fee configuration: net_bps_per_ticket = %', net_bps_per_ticket;
    END IF;

    RETURN FLOOR(bps_delta / net_bps_per_ticket);
END;
$function$;

ALTER FUNCTION "public"."calculate_tickets_from_bps_with_fee"(numeric, numeric) OWNER TO "postgres";

COMMENT ON FUNCTION "public"."calculate_tickets_from_bps_with_fee" IS 'Calculates the number of tickets from BPS delta using the historical fee at the given block';

REVOKE ALL ON FUNCTION "public"."calculate_tickets_from_bps_with_fee"(numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_tickets_from_bps_with_fee"(numeric, numeric) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_tickets_from_bps_with_fee"(numeric, numeric) TO "service_role";

-- Trigger function to calculate incremental tickets purchased
CREATE OR REPLACE FUNCTION public.calculate_tickets_purchased_count()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    tickets_count numeric;
BEGIN
    tickets_count := calculate_tickets_from_bps_with_fee(NEW.tickets_purchased_total_bps, NEW.block_num);
    NEW.tickets_purchased_count := tickets_count;

    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."calculate_tickets_purchased_count"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."calculate_tickets_purchased_count"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."calculate_tickets_purchased_count"() FROM "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_tickets_purchased_count"() TO "service_role";
