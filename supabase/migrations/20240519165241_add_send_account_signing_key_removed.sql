create table "public"."send_account_signing_key_removed" (
    "chain_id" numeric,
    "log_addr" bytea,
    "block_time" numeric,
    "tx_hash" bytea,
    "account" bytea,
    "key_slot" smallint,
    "key" bytea,
    "ig_name" text,
    "src_name" text,
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);


CREATE INDEX shovel_account ON public.send_account_created USING btree (account);

CREATE UNIQUE INDEX u_send_account_signing_key_removed ON public.send_account_signing_key_removed USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

ALTER TABLE "public"."send_account_signing_key_removed"
    ENABLE ROW LEVEL SECURITY;

create policy "users can see own signing key removed" on public.send_account_signing_key_removed as permissive for
select
  to public using (
    (
      (lower(concat('0x', encode(account, 'hex'::text))))::citext IN (
        SELECT
          send_accounts.address
        FROM
          send_accounts
        WHERE
          (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
      )
    )
  );
