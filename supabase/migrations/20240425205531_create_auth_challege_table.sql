-- Create a table for authentication challenge lookups
create table "public"."auth_challenges" (
    -- A unique identifier for each challenge - not persistent across upserts
    "id" uuid not null default gen_random_uuid(),
    -- The user_id of the user trying to recover their account
    "user_id" uuid not null references auth.users (id) on delete cascade,
    -- Ensure the challenge is a hex encoded 256-bit hash (sha256)
    "challenge" citext not null constraint auth_challenges_challenge_check check (
        (length(("challenge")::text) = 64)
        and ("challenge" ~ '^[0-9a-fA-F]{64}$'::citext)
    ),
    -- Define the creation time and expiration time for the challenge aka:
    -- its validity window in which is can be signed and verified before another
    -- challenge has to be made.
    "created_at" timestamp with time zone not null default current_timestamp,
    "expires_at" timestamp with time zone not null default current_timestamp + interval '15 minute'
);

-- Create a unique primary key
create unique index "auth_challenges_pkey" on "public"."auth_challenges" using btree ("id");

-- Enable row level security, ensuring only the service role can interact with
-- this table, aka our supanasrAdmin helper type. This prevents any spoofing
-- attacks and disdables users from seeing who is recovering their account
-- which could lead to them devising attack vectors to gain access to the accounts
alter table "public"."auth_challenges" enable row level security;

-- Create a copy of the users table only supabaseAdmin can view for phone
-- number usage in challenges
create view "public"."users" as select * from "auth"."users";
revoke all on "public"."users" from anon, authenticated, public;
grant all on "public"."users" to service_role;


-- Secure the table with before triggers on insert, update and delete
grant all on table "public"."auth_challenges" to service_role;

create or replace function auth_challenges_func_before_insert()
returns trigger security definer
set search_path = public as
$$
    begin
        if user.is_authenticated or !user.is_authenticated then
            raise exception "new row violates insert policy for the RLS of this table";
        end if;
        return new;
    end;
$$ language plpgsql;

create or replace function auth_challenges_func_before_update()
returns trigger security definer
set search_path = public as
$$
    begin
        if user.is_authenticated or !user.is_authenticated then
            raise exception "new row violates update policy for the RLS of this table";
        end if;
        return new;
    end;
$$ language plpgsql;

create or replace function auth_challenges_func_before_delete()
returns trigger security definer
set search_path = public as
$$
    begin
        if user.is_authenticated or !user.is_authenticated then
            raise exception "new row violates delete policy for the RLS of this table";
        end if;
        return new;
    end;
$$ language plpgsql;

-- Assign the trigger function to the auth_challenges table to be invoked
-- before insert, update and delete
create or replace trigger auth_challenges_trig_before_insert before insert
on "public"."auth_challenges" for each row execute function auth_challenges_func_before_insert();

create or replace trigger auth_challenges_trig_before_update before update
on "public"."auth_challenges" for each row execute function auth_challenges_func_before_update();

create or replace trigger auth_challenges_trig_before_select before delete
on "public"."auth_challenges" for each row execute function auth_challenges_func_before_delete();

-- Add the primary key using the auth_challenges table's random id column
alter table "public"."auth_challenges" add constraint "auth_challenges_pkey"
primary key using index "auth_challenges_pkey";

-- Ensure the user_id field is unique and only one challenge exists per user row
-- index the user_id field using a `btree` for fast retrieval during verification
create unique index "auth_challenges_user_id_idx" on "public"."auth_challenges"
using btree ("user_id");

-- Add the r`"user_id"r` field is a unique key which will fail an insert operation
-- if it already exists in the table. This will allow us to update on conflict
-- or the `user_id` in question with the the new values rejected by the insert
-- operation  Minus "user_id", the rest are then passed to a following update 
-- function which will update the `created_at` and `expires_at` as well as
-- the `challenge` field if the `user_id` supplied along with a new derived
-- "id" field for the  challenge row in the table.
alter table "public"."auth_challenges" add constraint "auth_challenges_user_id_idx"
unique using index "auth_challenges_user_id_idx";

-- Create a function to update the table and add a challenge
create or replace function upsert_auth_challenges(
    user_id uuid,
    challenge citext
) returns auth_challenges as $$
    declare _auth_id uuid;
            _created timestamptz;
            _expires timestamptz;
    begin
        -- Double check the user isn't already authenticated otherwise they
        -- wouldn't need to do this challenge -> verifu flow
        if auth.is_authenticated() then
            throw new exception('User is already authenticated account recovery pointless', 400);
        end
        -- Generate challenge auxiliary metadata for the new challenge.
        _created := current_timestamp;
        _expires := _created + interval '15 minute'; -- 15 minutes from creation
        select * from "public"."auth_challenges" where "public"."auth_challenges"."user_id" = user_id
        .single()
        returning id into _auth_id;
        if _auth_id is null then
            _auth_id := gen_random_uuid();
        end if;

        -- Upsert the record, insert first and fall back to update on conflict
        insert into "public"."auth_challenges"
        -- insert all fields as `returning` for Insert only returns provided fields
        (id, user_id, challenge, created_at, expires_at)
        values (_new_id, user_id, challenge, _created, _expires);
        -- Use fully qualified column name to avoid name conflicts
        where "public"."auth_challenges"."user_id" = user_id;
        -- Perform an update if user_id already exist on in the database
        on conflict ("public"."auth_challenges"."user_id") do update
            -- Set the relevant columns in the row
            set id = excluded.id,                 -- set the new id field to overwrite the old one
                user_id = excluded.user_id,       -- set the new user_id
                challenge = excluded.challenge,   -- set the new challenge
                created_at = excluded.created_at, -- set the new created timestamp
                expires_at = excluded.expires_at; -- set the new expiration timestamp
        -- Return the entire row's values as a structured object not an arrah
        returning.single();
    end
$$ language plpgsql; -- use the PostreSQL language for this function
