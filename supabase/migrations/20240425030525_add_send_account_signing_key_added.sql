create table "public"."send_account_signing_key_added"
(
    "chain_id"   numeric  not null,
    "log_addr"   bytea    not null,
    "block_time" numeric  not null,
    "tx_hash"    bytea    not null,
    "account"    bytea    not null,
    "key_slot"   smallint not null,
    "key"        bytea    not null,
    "ig_name"    text     not null,
    "src_name"   text     not null,
    "block_num"  numeric  not null,
    "tx_idx"     integer  not null,
    "log_idx"    integer  not null,
    "abi_idx"    smallint not null
);

create unique index u_send_account_signing_key_added on public.send_account_signing_key_added using btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

create index send_account_signing_key_added_account_idx on public.send_account_signing_key_added using btree (account);

alter table "public"."send_account_signing_key_added"
    enable row level security;

create policy "Send account signing key added can be read by the user who created it" on "public"."send_account_signing_key_added" as permissive for select to public using (
    account in ( select decode(substring(address, 3), 'hex')
                 from "public"."send_accounts"
                 where (user_id = ( select auth.uid() as uid )) ));
