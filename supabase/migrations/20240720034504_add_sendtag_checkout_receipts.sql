create table "public"."sendtag_checkout_receipts" (
    "id"         serial primary key,
    "event_id"   text    not null generated always as (
        "ig_name" || '/' || "src_name" || '/' || "block_num"::text || '/' || "tx_idx"::text || '/' ||
        "log_idx"::text ||  '/' || "abi_idx"::text ) stored,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "sender" bytea not null,
    "amount" numeric not null,
    "referrer" bytea not null,
    "reward" numeric not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null
);

alter table "public"."sendtag_checkout_receipts" enable row level security;

CREATE UNIQUE INDEX u_sendtag_checkout_receipts ON public.sendtag_checkout_receipts USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

create index sendtag_checkout_receipts_sender_idx on public.sendtag_checkout_receipts using btree (sender);
