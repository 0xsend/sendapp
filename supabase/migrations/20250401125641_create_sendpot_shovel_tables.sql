create table "public"."send_pot_user_ticket_purchases"(
    "id" serial primary key,
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "referrer" bytea,
    "value" numeric,
    "recipient" bytea,
    "buyer" bytea,
    "tickets_purchased_total_bps" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

CREATE POLICY "users can see their own ticket purchases"
ON public.send_pot_user_ticket_purchases
AS PERMISSIVE
FOR SELECT
TO public
USING (
    (
        (lower(concat('0x', encode(recipient, 'hex'::text))))::citext IN (
            SELECT sa.address
            FROM public.send_accounts AS sa
            WHERE sa.user_id = auth.uid()
        )
    )
);

CREATE POLICY "authenticated can read jackpot runs"
ON public.send_pot_jackpot_runs
FOR SELECT
TO authenticated
USING (true);

alter table public."send_pot_user_ticket_purchases" enable row level security;
create index send_pot_user_ticket_purchases_referrer on public.send_pot_user_ticket_purchases using btree(referrer);
create index send_pot_user_ticket_purchases_recipient on public.send_pot_user_ticket_purchases using btree(recipient);
create index send_pot_user_ticket_purchases_buyer on public.send_pot_user_ticket_purchases using btree(buyer);

create table "public"."send_pot_jackpot_runs"(
    "id" serial primary key,
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "time" numeric,
    "winner" bytea,
    "winning_ticket" numeric,
    "win_amount" numeric,
    "tickets_purchased_total_bps" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

alter table "public"."send_pot_jackpot_runs" enable row level security;

create index send_pot_jackpot_runs_winner on public.send_pot_jackpot_runs using btree(winner);

-- Jackpot summary returns the user jackpots summary where it aggregates user ticket purchases based off jackpot block_num.
-- num_runs is the number of jackpot runs to chose from, in descending order from block_num.
-- Example: There are two jackpots, jackpot 1 (block num 100) and jackpot 2 (block num 150)
-- User purchases a ticket on block 85, 99, this correlates to jackpot 1.
-- User purchase a ticket on block 100 and 150. This correlates to jackpot 2
-- Note if there is a purchase on the same block of the jackpot, then this means the purchase is for the next jackpot.
CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(
    num_runs integer
)
RETURNS TABLE(
    jackpot_run_id integer,
    jackpot_block_num numeric,
    jackpot_block_time numeric,
    winner bytea,
    win_amount numeric,
    total_tickets numeric
)
LANGUAGE sql
AS $$
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
  FROM public.send_pot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_total_bps), 0)
    FROM public.send_pot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets
FROM cte c
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$$;

-- This function calculates and returns the total number of tickets purchased
-- for the pending jackpot. The pending jackpot includes all user ticket purchases
-- that occurred after the last completed jackpot run.
CREATE OR REPLACE FUNCTION public.get_pending_jackpot_tickets_purchased()
RETURNS numeric
LANGUAGE sql
AS $$
WITH last_jackpot AS (
    -- Retrieve the maximum block number from the send_pot_jackpot_runs table.
  -- This block number represents the end of the last completed jackpot.
  -- If no jackpot runs exist, use 0 as the default value.
  SELECT COALESCE(MAX(block_num), 0) AS last_block
  FROM public.send_pot_jackpot_runs
)
-- Sum the tickets purchased (tickets_purchased_total_bps) from the send_pot_user_ticket_purchases
-- table for all rows where the block_num is greater than or equal to the last completed jackpot's block.
SELECT COALESCE(SUM(tickets_purchased_total_bps), 0) AS total_tickets
FROM public.send_pot_user_ticket_purchases
WHERE block_num >= (SELECT last_block FROM last_jackpot);
$$;