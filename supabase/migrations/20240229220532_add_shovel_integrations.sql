create table "public"."send_account_deployed"(
    "id" serial,
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "user_op_hash" bytea,
    "sender" bytea,
    "factory" bytea,
    "paymaster" bytea,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

alter table "public"."send_account_deployed" enable row level security;

create index send_account_deployed_sender on public.send_account_deployed using btree(sender);

create index shovel_log_addr on public.send_account_deployed using btree(log_addr);

create index shovel_sender on public.send_account_deployed using btree(sender);

create unique index u_send_account_deployed on public.send_account_deployed using btree(ig_name,
    src_name, block_num, tx_idx, log_idx, abi_idx);

create table "public"."send_account_transfers"(
    "id" serial,
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "f" bytea,
    "t" bytea,
    "v" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

alter table "public"."send_account_transfers" enable row level security;

create unique index u_send_account_transfers on public.send_account_transfers using btree(ig_name,
    src_name, block_num, tx_idx, log_idx, abi_idx);

create index send_account_transfers_f on public.send_account_transfers using btree(f);

create index send_account_transfers_t on public.send_account_transfers using btree(t);

create table "public"."send_token_transfers"(
    "id" serial,
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "f" bytea,
    "t" bytea,
    "v" numeric,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);

alter table "public"."send_token_transfers" enable row level security;

create index send_token_transfers_f on public.send_token_transfers using btree(f);

create index send_token_transfers_t on public.send_token_transfers using btree(t);

create unique index u_send_token_transfers on public.send_token_transfers using btree(ig_name,
    src_name, block_num, tx_idx, log_idx, abi_idx);
