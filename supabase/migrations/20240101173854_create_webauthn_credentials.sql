create type "public"."key_type_enum" as enum ('ES256');

create table "public"."webauthn_credentials" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "raw_credential_id" bytea not null,
    "user_id" uuid not null default auth.uid(),
    "public_key" bytea not null,
    "key_type" key_type_enum not null,
    "sign_count" bigint not null,
    "attestation_object" bytea not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);

alter table "public"."webauthn_credentials" enable row level security;

CREATE UNIQUE INDEX webauthn_credentials_pkey ON public.webauthn_credentials USING btree (id);

alter table "public"."webauthn_credentials"
add constraint "webauthn_credentials_pkey" PRIMARY KEY using index "webauthn_credentials_pkey";

CREATE UNIQUE INDEX webauthn_credentials_raw_credential_id ON public.webauthn_credentials USING btree (raw_credential_id, user_id);

CREATE UNIQUE INDEX webauthn_credentials_public_key ON public.webauthn_credentials USING btree (public_key);

alter table "public"."webauthn_credentials"
add constraint "webauthn_credentials_sign_count_check" CHECK ((sign_count >= 0)) not valid;

alter table "public"."webauthn_credentials" validate constraint "webauthn_credentials_sign_count_check";

alter table "public"."webauthn_credentials"
add constraint "webauthn_credentials_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) on delete cascade;

alter table "public"."webauthn_credentials" validate constraint "webauthn_credentials_user_id_fkey";

create policy "insert_own_credentials" on "public"."webauthn_credentials" as permissive for
insert to authenticated with check ((auth.uid() = user_id));

create policy "select_own_credentials" on "public"."webauthn_credentials" as permissive for
select to authenticated using ((auth.uid() = user_id));

create policy "update_own_credentials" on "public"."webauthn_credentials" as permissive for
update to authenticated using ((auth.uid() = user_id));
