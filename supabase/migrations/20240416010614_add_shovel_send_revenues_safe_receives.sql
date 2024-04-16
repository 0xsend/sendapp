create table "public"."send_revenues_safe_receives" (
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "sender" bytea,
    "v" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

alter table "public"."send_revenues_safe_receives" enable row level security;

create unique index u_send_revenues_safe_receives on public.send_revenues_safe_receives using btree(ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

create index send_revenues_safe_receives_sender on public.send_revenues_safe_receives using btree(sender);

create index send_revenues_safe_receives_tx_hash on public.send_revenues_safe_receives using btree(tx_hash);

create index send_revenues_safe_receives_block_num on public.send_revenues_safe_receives using btree(block_num);

