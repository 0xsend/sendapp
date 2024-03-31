create table "public"."send_account_created" (
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "user_op_hash" bytea,
    "tx_hash" bytea,
    "account" bytea,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer
);

CREATE INDEX shovel_account ON public.send_account_created USING btree (account);

CREATE UNIQUE INDEX u_send_account_created ON public.send_account_created USING btree (ig_name, src_name, block_num, tx_idx, log_idx);

ALTER TABLE "public"."send_account_created" ENABLE ROW LEVEL SECURITY;

DROP TABLE "public"."send_account_deployed"; -- whoopsie, didn't need this table
