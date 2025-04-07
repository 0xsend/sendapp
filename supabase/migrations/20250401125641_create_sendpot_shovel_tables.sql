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

alter table public."send_pot_user_ticket_purchases" enable row level security;

create unique index u_send_pot_user_ticket_purchases on public.send_pot_user_ticket_purchases using btree(ig_name,
    src_name, block_num, tx_idx, log_idx, abi_idx);

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

create unique index u_send_pot_jackpot_runs  on public.send_pot_jackpot_runs  using btree(ig_name,
    src_name, block_num, tx_idx, log_idx, abi_idx);

create index send_pot_jackpot_runs_winner on public.send_pot_jackpot_runs using btree(winner);

CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(
    num_runs integer
)
RETURNS TABLE(
    jackpot_run_id integer,
    jackpot_block_num numeric,
    winner bytea,
    win_amount numeric,
    total_tickets numeric
)
LANGUAGE sql
AS $$
WITH limited_runs AS (
  -- Select the last (num_runs + 1) jackpot runs, then reorder them in ascending order.
  SELECT *
  FROM (
    SELECT *
    FROM public.send_pot_jackpot_runs
    ORDER BY block_num DESC
    LIMIT (num_runs + 1)
  ) sub
  ORDER BY block_num ASC
),
jackpot_ranges AS (
  -- Calculate the upper boundary for each round using LEAD.
  SELECT
    id AS jackpot_run_id,
    block_num AS jackpot_block_num,
    LEAD(block_num) OVER (ORDER BY block_num) AS next_block_num,
    winner,
    win_amount
  FROM limited_runs
)
SELECT
  jr.jackpot_run_id,
  jr.jackpot_block_num,
  jr.winner,
  jr.win_amount,
  COALESCE(SUM(p.tickets_purchased_total_bps), 0) AS total_tickets
FROM jackpot_ranges jr
LEFT JOIN public.send_pot_user_ticket_purchases p
  ON p.block_num >= jr.jackpot_block_num
  AND (p.block_num < jr.next_block_num OR jr.next_block_num IS NULL)
-- Exclude the extra row used for boundary calculation.
WHERE jr.jackpot_block_num > (SELECT MIN(block_num) FROM limited_runs)
GROUP BY jr.jackpot_run_id, jr.jackpot_block_num, jr.winner, jr.win_amount
ORDER BY jr.jackpot_block_num DESC;
$$;