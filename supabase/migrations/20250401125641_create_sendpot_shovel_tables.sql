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
