create sequence "public"."sendpot_fee_history_id_seq";

create table "public"."sendpot_fee_history" (
    "id" bigint not null default nextval('sendpot_fee_history_id_seq'::regclass),
    "block_num" numeric not null,
    "block_time" numeric not null,
    "tx_hash" bytea,
    "fee_bps" numeric not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."sendpot_fee_history" enable row level security;

alter table "public"."sendpot_user_ticket_purchases" add column "tickets_purchased_count" numeric;

alter sequence "public"."sendpot_fee_history_id_seq" owned by "public"."sendpot_fee_history"."id";

CREATE INDEX idx_sendpot_fee_history_block_num ON public.sendpot_fee_history USING btree (block_num);

CREATE UNIQUE INDEX sendpot_fee_history_pkey ON public.sendpot_fee_history USING btree (id);

CREATE UNIQUE INDEX u_sendpot_fee_history_block_num ON public.sendpot_fee_history USING btree (block_num);

alter table "public"."sendpot_fee_history" add constraint "sendpot_fee_history_pkey" PRIMARY KEY using index "sendpot_fee_history_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.calculate_tickets_from_bps_with_fee(bps_delta numeric, block_num numeric)
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
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_tickets_purchased_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    prev_total_bps numeric;
    bps_delta numeric;
    tickets_count numeric;
BEGIN
    SELECT tickets_purchased_total_bps INTO prev_total_bps
    FROM sendpot_user_ticket_purchases
    WHERE buyer = NEW.buyer
      AND (
        block_num < NEW.block_num
        OR (block_num = NEW.block_num AND tx_idx < NEW.tx_idx)
        OR (block_num = NEW.block_num AND tx_idx = NEW.tx_idx AND log_idx < NEW.log_idx)
      )
    ORDER BY block_num DESC, tx_idx DESC, log_idx DESC
    LIMIT 1;

    IF prev_total_bps IS NULL THEN
        prev_total_bps := 0;
    END IF;

    bps_delta := NEW.tickets_purchased_total_bps - prev_total_bps;
    tickets_count := calculate_tickets_from_bps_with_fee(bps_delta, NEW.block_num);
    NEW.tickets_purchased_count := tickets_count;

    RETURN NEW;
END;
$function$
;

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
$function$
;

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

grant delete on table "public"."sendpot_fee_history" to "anon";

grant insert on table "public"."sendpot_fee_history" to "anon";

grant references on table "public"."sendpot_fee_history" to "anon";

grant select on table "public"."sendpot_fee_history" to "anon";

grant trigger on table "public"."sendpot_fee_history" to "anon";

grant truncate on table "public"."sendpot_fee_history" to "anon";

grant update on table "public"."sendpot_fee_history" to "anon";

grant delete on table "public"."sendpot_fee_history" to "authenticated";

grant insert on table "public"."sendpot_fee_history" to "authenticated";

grant references on table "public"."sendpot_fee_history" to "authenticated";

grant select on table "public"."sendpot_fee_history" to "authenticated";

grant trigger on table "public"."sendpot_fee_history" to "authenticated";

grant truncate on table "public"."sendpot_fee_history" to "authenticated";

grant update on table "public"."sendpot_fee_history" to "authenticated";

grant delete on table "public"."sendpot_fee_history" to "service_role";

grant insert on table "public"."sendpot_fee_history" to "service_role";

grant references on table "public"."sendpot_fee_history" to "service_role";

grant select on table "public"."sendpot_fee_history" to "service_role";

grant trigger on table "public"."sendpot_fee_history" to "service_role";

grant truncate on table "public"."sendpot_fee_history" to "service_role";

grant update on table "public"."sendpot_fee_history" to "service_role";

create policy "authenticated can read fee history"
on "public"."sendpot_fee_history"
as permissive
for select
to authenticated
using (true);


CREATE TRIGGER calculate_tickets_purchased_count_trigger BEFORE INSERT ON public.sendpot_user_ticket_purchases FOR EACH ROW EXECUTE FUNCTION calculate_tickets_purchased_count();

-- Insert historical fee values
-- Fee history for the Sendpot contract:
-- 1. From genesis (block 0) to block 38567473: feeBps = 3000 (net 7000 BPS per ticket)
-- 2. From block 38567474 onwards: feeBps = 7000 (net 3000 BPS per ticket)
INSERT INTO public.sendpot_fee_history (block_num, block_time, fee_bps, tx_hash)
VALUES
    (0, 0, 3000, NULL),
    (38567474, 0, 7000, NULL)
ON CONFLICT (block_num) DO NOTHING;

-- Backfill existing records
-- Calculate tickets_purchased_count for all existing records
-- Uses a window function to get the previous BPS total for each buyer
-- and the historical fee lookup function for accurate calculations
WITH ordered_purchases AS (
    SELECT
        id,
        buyer,
        tickets_purchased_total_bps,
        LAG(tickets_purchased_total_bps) OVER (
            PARTITION BY buyer
            ORDER BY block_num, tx_idx, log_idx
        ) AS prev_total_bps,
        block_num,
        tx_idx,
        log_idx
    FROM sendpot_user_ticket_purchases
    ORDER BY buyer, block_num, tx_idx, log_idx
)
UPDATE sendpot_user_ticket_purchases AS utp
SET tickets_purchased_count = calculate_tickets_from_bps_with_fee(
    op.tickets_purchased_total_bps - COALESCE(op.prev_total_bps, 0),
    op.block_num
)
FROM ordered_purchases AS op
WHERE utp.id = op.id
  AND utp.tickets_purchased_count IS NULL;
