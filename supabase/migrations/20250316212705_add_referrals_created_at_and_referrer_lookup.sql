set check_function_bodies = off;

-- add created_at to referrals
alter table referrals
  add column created_at timestamp with time zone default now();

-- infer created_at from tags
UPDATE referrals refs
SET created_at = t.created_at
FROM tags t
WHERE t.name = refs.tag;

alter table referrals
  alter column created_at set not null;


CREATE TYPE profile_lookup_result AS (
    id uuid,
    avatar_url text,
    name text,
    about text,
    refcode text,
    x_username text,
    tag citext,
    address citext,
    chain_id integer,
    is_public boolean,
    sendid integer,
    all_tags text[]
);

-- function so users can find who referred them.
CREATE OR REPLACE FUNCTION referrer_lookup(referral_code text default null)
RETURNS TABLE(
    referrer profile_lookup_result,
    new_referrer profile_lookup_result
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    ref_result profile_lookup_result;
    new_ref_result profile_lookup_result;
    referrer_send_id text;
BEGIN
    -- Find the current user's referrer's send_id (if exists)
    SELECT send_id INTO referrer_send_id
    FROM referrals r
    JOIN profiles p ON r.referrer_id = p.id
    WHERE r.referred_id = auth.uid()
    LIMIT 1;

    -- Look up existing referrer if valid send_id exists
    IF referrer_send_id IS NOT NULL AND referrer_send_id != '' THEN
        SELECT * INTO ref_result
        FROM profile_lookup('sendid'::lookup_type_enum, referrer_send_id)
        LIMIT 1;
    END IF;

    -- Look up new referrer if:
    -- 1. referral_code is valid AND
    -- 2. No existing referrer found
    IF referral_code IS NOT NULL AND referral_code != '' AND referrer_send_id IS NULL THEN
        -- Try tag lookup first, then refcode if needed
        SELECT * INTO new_ref_result
        FROM profile_lookup('tag'::lookup_type_enum, referral_code)
        LIMIT 1;

        IF new_ref_result IS NULL THEN
            SELECT * INTO new_ref_result
            FROM profile_lookup('refcode'::lookup_type_enum, referral_code)
            LIMIT 1;
        END IF;
    END IF;

    RETURN QUERY
    SELECT ref_result, new_ref_result;
END;
$$;