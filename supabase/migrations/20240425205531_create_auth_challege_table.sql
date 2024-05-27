create table "public"."challenges" (
    "id" serial primary key,
    "challenge" bytea not null,
    "created_at" timestamp with time zone not null default current_timestamp,
    "expires_at" timestamp with time zone not null default current_timestamp + interval '15 minute',
    unique (challenge)
);


alter table "public"."challenges" enable row level security;
grant all on table "public"."challenges" to service_role;
grant select, insert, update on "public"."challenges" to anon, authenticated;

create or replace function insert_challenge(
    challenge bytea
) returns challenges as $$
    #variable_conflict use_column
    declare 
            _challenge alias for $1;
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (challenge, created_at, expires_at)
        VALUES (challenge, _created, _expires)
        ON CONFLICT (challenge) DO NOTHING
        RETURNING * into _new_challenge;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Duplicate challenge detected';
        END IF;

        return _new_challenge;
    end
$$ LANGUAGE plpgsql;