create table "public"."challenges" (
    "id" serial primary key,
    "user_id" uuid not null references auth.users (id) on delete cascade,
    "challenge" bytea not null,
    "created_at" timestamp with time zone not null default current_timestamp,
    "expires_at" timestamp with time zone not null default current_timestamp + interval '15 minute',
    unique (user_id)
);


alter table "public"."challenges" enable row level security;
grant all on table "public"."challenges" to service_role;
grant select, insert, update on "public"."challenges" to anon, authenticated;

create or replace function upsert_challenges(
    user_id uuid,
    challenge bytea
) returns challenges as $$
    #variable_conflict use_column
    declare 
            _challenge alias for $2;
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (user_id, challenge, created_at, expires_at)
        VALUES (user_id, challenge, _created, _expires)
        ON CONFLICT (user_id) do UPDATE
        SET
            challenge = _challenge,
            created_at = _created,
            expires_at = _expires
        returning * into _new_challenge;

        return _new_challenge;
    end
$$ language plpgsql;
