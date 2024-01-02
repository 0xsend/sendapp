/**
 Schema to track users' send smart contract account. A key slot is assocciated with each webauthn credential that is required when sending ERC-4337 user operation transactions.
 */
create table "public"."send_accounts" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null default auth.uid() references auth.users (id) on delete cascade,
  address citext not null constraint chain_addresses_address_check check (
    (length((address)::text) = 42)
    and (address ~ '^0x[A-Fa-f0-9]{40}$'::citext)
  ),
  "chain_id" integer not null,
  "created_at" timestamp with time zone default current_timestamp,
  "updated_at" timestamp with time zone default current_timestamp
);

create unique index "send_accounts_pkey" on "public"."send_accounts" using btree ("id");

alter table "public"."send_accounts"
add constraint "send_accounts_pkey" primary key using index "send_accounts_pkey";

create unique index "send_accounts_address_key" on "public"."send_accounts" using btree ("address", "chain_id");

create index "send_accounts_user_id_index" on "public"."send_accounts" using btree ("user_id");

alter table "public"."send_accounts" enable row level security;

create policy "insert_own_accounts" on "public"."send_accounts" as permissive for
insert to authenticated with check ((auth.uid() = user_id));

create policy "select_own_accounts" on "public"."send_accounts" as permissive for
select to authenticated using ((auth.uid() = user_id));

create policy "update_own_accounts" on "public"."send_accounts" as permissive for
update to authenticated using ((auth.uid() = user_id));

-- Linking Send accounts to webauthn credentials
create table "public"."send_account_credentials" (
  "account_id" uuid not null,
  "credential_id" uuid not null,
  "key_slot" integer not null,
  "created_at" timestamp with time zone default current_timestamp
);

create unique index account_credentials_pkey on public."send_account_credentials" using btree (account_id, credential_id);

alter table "public"."send_account_credentials"
add constraint "account_credentials_pkey" primary key using index "account_credentials_pkey";

alter table "public"."send_account_credentials"
add constraint "account_credentials_account_id_fkey" foreign key (account_id) references send_accounts (id) on delete cascade;

alter table "public"."send_account_credentials"
add constraint "account_credentials_credential_id_fkey" foreign key (credential_id) references webauthn_credentials (id);

alter table "public"."send_account_credentials" enable row level security;

create policy "insert_own_account_credentials" on "public"."send_account_credentials" as permissive for
insert to authenticated with check (
    (
      auth.uid() = (
        select user_id
        from send_accounts
        where id = account_id
      )
    )
  );

create policy "select_own_account_credentials" on "public"."send_account_credentials" as permissive for
select to authenticated using (
    (
      auth.uid() = (
        select user_id
        from send_accounts
        where id = account_id
      )
    )
  );

-- Allow users to remove (disassociate) credentials from their send account
create policy "delete_own_account_credentials" on "public"."send_account_credentials" as permissive for delete to authenticated using (
  (
    auth.uid() = (
      select user_id
      from send_accounts
      where id = account_id
    )
  )
);
