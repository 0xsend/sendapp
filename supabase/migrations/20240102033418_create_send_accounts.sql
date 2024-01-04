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
  "init_code" bytea not null,
  "created_at" timestamp with time zone not null default current_timestamp,
  "updated_at" timestamp with time zone not null default current_timestamp,
  "deleted_at" timestamp with time zone
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
  "key_slot" integer not null constraint account_credentials_key_slot_check check (
    key_slot >= 0
    and key_slot <= 255
  ),
  "created_at" timestamp with time zone default current_timestamp
);

create unique index account_credentials_pkey on public."send_account_credentials" using btree (account_id, credential_id);

create unique index "send_account_credentials_account_id_key_slot_key" on "public"."send_account_credentials" using btree ("account_id", "key_slot");

alter table "public"."send_account_credentials"
add constraint "account_credentials_pkey" primary key using index "account_credentials_pkey";

alter table "public"."send_account_credentials"
add constraint "account_credentials_account_id_fkey" foreign key (account_id) references send_accounts (id) on delete cascade;

alter table "public"."send_account_credentials"
add constraint "account_credentials_credential_id_fkey" foreign key (credential_id) references webauthn_credentials (id) on delete cascade;

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

-- function to create a send account and associate it with a webauthn credential
create or replace function "public"."create_send_account"(
    send_account send_accounts,
    webauthn_credential webauthn_credentials,
    key_slot int
  ) returns json language plpgsql as $$
declare _send_account send_accounts;

_webauthn_credential webauthn_credentials;

begin --

-- insert the credential
insert into webauthn_credentials (
    name,
    display_name,
    raw_credential_id,
    public_key,
    sign_count,
    attestation_object,
    key_type
  )
values (
    webauthn_credential.name,
    webauthn_credential.display_name,
    webauthn_credential.raw_credential_id,
    webauthn_credential.public_key,
    webauthn_credential.sign_count,
    webauthn_credential.attestation_object,
    webauthn_credential.key_type
  )
returning * into _webauthn_credential;

-- insert the send account
insert into send_accounts (address, chain_id, init_code)
values (
    send_account.address,
    send_account.chain_id,
    send_account.init_code
  ) on conflict (address, chain_id) do
update
set init_code = excluded.init_code
returning * into _send_account;

-- associate the credential with the send account
insert into send_account_credentials (account_id, credential_id, key_slot)
values (
    _send_account.id,
    _webauthn_credential.id,
    $3
  );

-- return the send account
return json_build_object(
  'send_account',
  _send_account,
  'webauthn_credential',
  _webauthn_credential
);

end;

$$;
