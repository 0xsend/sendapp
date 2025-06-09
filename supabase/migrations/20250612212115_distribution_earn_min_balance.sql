create extension if not exists "pgjwt" with schema "extensions";


alter table "public"."distributions" add column "earn_min_balance" bigint not null default 0;

update distributions set earn_min_balance = 5e6 where number = 16;

CREATE INDEX idx_earn_deposit_owner_blocktime ON public.send_earn_deposit USING btree (owner, block_time DESC);

CREATE INDEX idx_earn_withdraw_owner_blocktime ON public.send_earn_withdraw USING btree (owner, block_time DESC);

create or replace view "public"."send_earn_balances_timeline" as  WITH all_transactions AS (
         SELECT send_earn_deposit.owner,
            send_earn_deposit.block_time,
            send_earn_deposit.assets AS balance
           FROM send_earn_deposit
        UNION ALL
         SELECT send_earn_withdraw.owner,
            send_earn_withdraw.block_time,
            (- send_earn_withdraw.assets) AS balance
           FROM send_earn_withdraw
        )
 SELECT all_transactions.owner,
    all_transactions.block_time,
    sum(all_transactions.balance) OVER (PARTITION BY all_transactions.owner ORDER BY all_transactions.block_time ROWS UNBOUNDED PRECEDING) AS balance
   FROM all_transactions
  ORDER BY all_transactions.block_time;



