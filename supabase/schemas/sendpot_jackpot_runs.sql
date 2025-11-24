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

-- RLS
ALTER TABLE "public"."sendpot_jackpot_runs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read jackpot runs" ON "public"."sendpot_jackpot_runs" FOR SELECT TO "authenticated" USING (true);

-- Grants
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "service_role";

GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(num_runs integer)
 RETURNS TABLE(jackpot_run_id integer, jackpot_block_num numeric, jackpot_block_time numeric, winner bytea, win_amount numeric, total_tickets numeric, winner_tag_name citext)
 LANGUAGE sql
AS $function$
WITH cte AS (
  SELECT
    r.id AS jackpot_run_id,
    r.block_num AS jackpot_block_num,
    r.block_time AS jackpot_block_time,
    r.winner,
    r.win_amount,
    -- "prev_block_num" is the block_num of the previous jackpot (or 0 if none)
    COALESCE(
      LAG(r.block_num) OVER (ORDER BY r.block_num ASC),
      0
    ) AS prev_block_num
  FROM public.sendpot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_count), 0)
    FROM public.sendpot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets,
  pl.winner_tag_name
FROM cte c
LEFT JOIN LATERAL (
  SELECT COALESCE(pl.main_tag_name, pl.all_tags[1])::public.citext AS winner_tag_name
  FROM public.profile_lookup(
    'address'::public.lookup_type_enum,
    concat('0x', encode(c.winner, 'hex'))::text
  ) pl
  LIMIT 1
) pl ON c.winner IS NOT NULL
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$function$
;


ALTER FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "service_role";


CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
 RETURNS numeric
 LANGUAGE sql
AS $function$
WITH last_jackpot AS (
    -- Retrieve the maximum block number from the sendpot_jackpot_runs table.
  -- This block number represents the end of the last completed jackpot.
  -- If no jackpot runs exist, use 0 as the default value.
  SELECT COALESCE(MAX(block_num), 0) AS last_block
  FROM public.sendpot_jackpot_runs
)
-- Sum the actual ticket counts from the sendpot_user_ticket_purchases table
-- for all purchases since the last completed jackpot
SELECT COALESCE(SUM(tickets_purchased_count), 0) AS total_tickets
FROM public.sendpot_user_ticket_purchases
WHERE block_num >= (SELECT last_block FROM last_jackpot);
$function$
;

ALTER FUNCTION "public"."get_pending_jackpot_tickets_purchased"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "service_role";
