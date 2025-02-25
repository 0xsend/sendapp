create table "public"."send_earn_create" (
    "id" generated always as identity not null,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "send_earn" bytea not null,
    "caller" bytea not null,
    "initial_owner" bytea not null,
    "vault" bytea not null,
    "fee_recipient" bytea not null,
    "collections" bytea not null,
    "fee" numeric not null,
    "salt" bytea not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored
);

ALTER TABLE public.send_earn_create ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX u_send_earn_create ON public.send_earn_create USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_create_send_earn ON public.send_earn_create USING btree (send_earn);

CREATE INDEX send_earn_create_block_num ON public.send_earn_create USING btree (block_num);

CREATE INDEX send_earn_create_block_time ON public.send_earn_create USING btree (block_time);

create table "public"."send_earn_new_affiliate" (
    "id" generated always as identity not null,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "affiliate" bytea not null,
    "send_earn_affiliate" bytea not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored
);

ALTER TABLE public.send_earn_new_affiliate ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX u_send_earn_new_affiliate ON public.send_earn_new_affiliate USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_new_affiliate_send_earn_affiliate_idx ON public.send_earn_new_affiliate USING btree (send_earn_affiliate);

CREATE INDEX send_earn_new_affiliate_affiliate_idx ON public.send_earn_new_affiliate USING btree (affiliate);

CREATE INDEX send_earn_new_affiliate_block_num ON public.send_earn_new_affiliate USING btree (block_num);

CREATE INDEX send_earn_new_affiliate_block_time ON public.send_earn_new_affiliate USING btree (block_time);
