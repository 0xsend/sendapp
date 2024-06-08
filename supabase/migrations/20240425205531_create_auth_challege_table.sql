create table "public"."challenges" (
    "id" serial primary key,
    "challenge" bytea not null default gen_random_bytes(64), 
    "created_at" timestamp with time zone not null default current_timestamp,
    "expires_at" timestamp with time zone not null default current_timestamp + interval '15 minute',
    unique (challenge)
);

alter table "public"."challenges" enable row level security;

create or replace function insert_challenge() returns challenges as $$
    #variable_conflict use_column
    declare 
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (created_at, expires_at)
        VALUES (_created, _expires)
        RETURNING * into _new_challenge;

        return _new_challenge;
    end
$$ LANGUAGE plpgsql;