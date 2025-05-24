

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_tle";









CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "shovel";


ALTER SCHEMA "shovel" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "temporal";


ALTER SCHEMA "temporal" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_feed_user" AS (
	"id" "uuid",
	"name" "text",
	"avatar_url" "text",
	"send_id" integer,
	"tags" "text"[]
);


ALTER TYPE "public"."activity_feed_user" OWNER TO "postgres";


CREATE TYPE "public"."key_type_enum" AS ENUM (
    'ES256'
);


ALTER TYPE "public"."key_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."lookup_type_enum" AS ENUM (
    'sendid',
    'tag',
    'refcode',
    'address',
    'phone'
);


ALTER TYPE "public"."lookup_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."profile_lookup_result" AS (
	"id" "uuid",
	"avatar_url" "text",
	"name" "text",
	"about" "text",
	"refcode" "text",
	"x_username" "text",
	"birthday" "date",
	"tag" "public"."citext",
	"address" "public"."citext",
	"chain_id" integer,
	"is_public" boolean,
	"sendid" integer,
	"all_tags" "text"[]
);


ALTER TYPE "public"."profile_lookup_result" OWNER TO "postgres";


CREATE TYPE "public"."tag_search_result" AS (
	"avatar_url" "text",
	"tag_name" "text",
	"send_id" integer,
	"phone" "text"
);


ALTER TYPE "public"."tag_search_result" OWNER TO "postgres";


CREATE TYPE "public"."tag_status" AS ENUM (
    'pending',
    'confirmed'
);


ALTER TYPE "public"."tag_status" OWNER TO "postgres";


CREATE TYPE "public"."temporal_status" AS ENUM (
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed'
);


ALTER TYPE "public"."temporal_status" OWNER TO "postgres";


CREATE TYPE "public"."verification_type" AS ENUM (
    'tag_registration',
    'tag_referral',
    'create_passkey',
    'send_ten',
    'send_one_hundred',
    'total_tag_referrals',
    'send_streak',
    'send_ceiling'
);


ALTER TYPE "public"."verification_type" OWNER TO "postgres";


CREATE TYPE "public"."verification_value_mode" AS ENUM (
    'individual',
    'aggregate'
);


ALTER TYPE "public"."verification_value_mode" OWNER TO "postgres";


CREATE TYPE "temporal"."transfer_status" AS ENUM (
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed',
    'cancelled'
);


ALTER TYPE "temporal"."transfer_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;


ALTER FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$$;


ALTER FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;


ALTER FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "tags" "text"[]) RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
select encode(sha256(referrer_id::text::bytea), 'hex') || '/' ||
       array_to_string(array(select distinct unnest(tags) order by 1), ',');
$$;


ALTER FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "referred_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN sha256(decode(replace(referrer_id::text, '-', '') || replace(referred_id::text, '-', ''), 'hex'))::text;
END;
$$;


ALTER FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "referred_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."insert_referral_on_create"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_referred_id UUID;
  v_referrer_id UUID;
  v_deposit_record RECORD;
BEGIN
  -- Find deposits made to this Send Earn contract
  FOR v_deposit_record IN
    SELECT d.owner, a.affiliate
    FROM send_earn_deposit d
    JOIN send_earn_new_affiliate a ON NEW.fee_recipient = a.send_earn_affiliate
    WHERE d.log_addr = NEW.send_earn
  LOOP
    -- Find the referred_id (user who made the deposit)
    SELECT user_id INTO v_referred_id
    FROM send_accounts
    WHERE address = lower(concat('0x', encode(v_deposit_record.owner, 'hex'::text)))::citext;

    -- Skip if we can't find the referred user
    IF v_referred_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Check if user was already referred
    IF EXISTS (
      SELECT 1 FROM referrals
      WHERE referred_id = v_referred_id
    ) THEN
      CONTINUE;
    END IF;

    -- Find the referrer_id (the affiliate)
    SELECT user_id INTO v_referrer_id
    FROM send_accounts
    WHERE address = lower(concat('0x', encode(v_deposit_record.affiliate, 'hex'::text)))::citext;


    -- Skip if we can't find the referrer user
    IF v_referrer_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Insert the new referral relationship with error handling
    BEGIN
      INSERT INTO referrals (referrer_id, referred_id, created_at)
      VALUES (v_referrer_id, v_referred_id, NOW());
    EXCEPTION
      WHEN unique_violation THEN
        -- A referral was already created (possibly by another concurrent process)
        RETURN NEW;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "private"."insert_referral_on_create"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."insert_referral_on_deposit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_referred_id UUID;
  v_referrer_id UUID;
  v_affiliate_address bytea;
BEGIN
  -- Find the referred_id (user who made the deposit)
  SELECT user_id INTO v_referred_id
  FROM send_accounts
  WHERE address = lower(concat('0x', encode(NEW.owner, 'hex'::text)))::citext;

  -- Skip if we can't find the referred user
  IF v_referred_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if user was already referred - if so, exit early
  IF EXISTS (
    SELECT 1 FROM referrals
    WHERE referred_id = v_referred_id
  ) THEN
    RETURN NEW;
  END IF;

  -- Find the affiliate's address and the referrer_id
  SELECT c.fee_recipient, sa.user_id
  INTO v_affiliate_address, v_referrer_id
  FROM send_earn_create c
  JOIN send_earn_new_affiliate a ON c.fee_recipient = a.send_earn_affiliate
  JOIN send_accounts sa ON lower(concat('0x', encode(a.affiliate, 'hex'::text)))::citext = sa.address
  WHERE c.send_earn = NEW.log_addr;


  -- Skip if we can't find the affiliate or referrer
  IF v_affiliate_address IS NULL OR v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert the new referral relationship with error handling
  BEGIN
    INSERT INTO referrals (referrer_id, referred_id, created_at)
    VALUES (v_referrer_id, v_referred_id, NOW());
  EXCEPTION
    WHEN unique_violation THEN
      -- A referral was already created (possibly by another concurrent process)
      RETURN NEW;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "private"."insert_referral_on_deposit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."insert_referral_on_new_affiliate"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_referred_id UUID;
  v_referrer_id UUID;
  v_deposit_record RECORD;
BEGIN
  -- Find the referrer_id (the affiliate)
  SELECT user_id INTO v_referrer_id
  FROM send_accounts
  WHERE address = lower(concat('0x', encode(NEW.affiliate, 'hex'::text)))::citext;

  -- Skip if we can't find the referrer user
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Process all deposits with the same transaction hash that match an earn contract
  -- where the fee_recipient matches the send_earn_affiliate
  FOR v_deposit_record IN
    SELECT d.owner
    FROM send_earn_deposit d
    JOIN send_earn_create c ON d.log_addr = c.send_earn
    WHERE d.tx_hash = NEW.tx_hash
    AND c.fee_recipient = NEW.send_earn_affiliate
  LOOP
    -- Find the referred_id (user who made the deposit)
    SELECT user_id INTO v_referred_id
    FROM send_accounts
    WHERE address = lower(concat('0x', encode(v_deposit_record.owner, 'hex'::text)))::citext;

    -- Skip if we can't find the referred user
    IF v_referred_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Check if user was already referred
    IF NOT EXISTS (
      SELECT 1 FROM referrals
      WHERE referred_id = v_referred_id
    ) THEN
      -- Insert the new referral relationship with error handling
      BEGIN
        INSERT INTO referrals (referrer_id, referred_id, created_at)
        VALUES (v_referrer_id, v_referred_id, NOW());
      EXCEPTION
        WHEN unique_violation THEN
          -- A referral was already created (possibly by another concurrent process)
          RETURN NEW;
      END;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "private"."insert_referral_on_new_affiliate"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."send_earn_deposit_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM activity
    WHERE event_id = OLD.event_id
        AND event_name = 'send_earn_deposit';
    RETURN OLD;
END;
$$;


ALTER FUNCTION "private"."send_earn_deposit_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."send_earn_deposit_trigger_insert_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _owner_user_id uuid;
    _data jsonb;
    _workflow_id TEXT;
BEGIN
    -- Select send app info for owner address (the Send account owner)
    -- Requires SELECT on public.send_accounts
    SELECT user_id INTO _owner_user_id
    FROM public.send_accounts
    WHERE address = concat('0x', encode(NEW.owner, 'hex'))::citext;

    -- Build data object with the same pattern as send_account_transfers
    -- Cast numeric values to text to avoid losing precision
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        'owner', NEW.owner,
        'assets', NEW.assets::text,
        'shares', NEW.shares::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    -- Insert into activity table - notice the similar pattern to send_account_transfers
    -- Requires INSERT/UPDATE on public.activity
    INSERT INTO public.activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    VALUES (
        'send_earn_deposit',
        NEW.event_id,
        _owner_user_id,  -- In this case from_user is the owner
        NULL,            -- No to_user for deposits
        _data,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    )
    ON CONFLICT (event_name, event_id) DO UPDATE SET
        from_user_id = COALESCE(EXCLUDED.from_user_id, activity.from_user_id), -- Keep existing if new is NULL
        to_user_id = EXCLUDED.to_user_id, -- Allow update if needed, though NULL here
        data = EXCLUDED.data,
        created_at = EXCLUDED.created_at;

    -- *** CLEANUP LOGIC ***
    DELETE FROM public.activity
    WHERE id in (
      SELECT activity_id
      FROM temporal.send_earn_deposits
      WHERE owner = NEW.owner
        AND block_num <= NEW.block_num
        AND status <> 'failed'
    );
    -- *** END CLEANUP LOGIC ***

    RETURN NEW;
END;
$$;


ALTER FUNCTION "private"."send_earn_deposit_trigger_insert_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."send_earn_withdraw_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM activity
    WHERE event_id = OLD.event_id
        AND event_name = 'send_earn_withdraw';
    RETURN OLD;
END;
$$;


ALTER FUNCTION "private"."send_earn_withdraw_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."send_earn_withdraw_trigger_insert_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _owner_user_id uuid;
    _data jsonb;
BEGIN
    -- Select send app info for owner address
    SELECT user_id INTO _owner_user_id
    FROM send_accounts
    WHERE address = concat('0x', encode(NEW.owner, 'hex'))::citext;

    -- Build data object with the same pattern as send_account_transfers
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        'receiver', NEW.receiver,
        'owner', NEW.owner,
        'assets', NEW.assets::text,
        'shares', NEW.shares::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    -- Insert into activity table with the same pattern
    INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    VALUES (
        'send_earn_withdraw',
        NEW.event_id,
        _owner_user_id,  -- In this case from_user is the owner
        NULL,            -- No to_user for withdrawals
        _data,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    )
    ON CONFLICT (event_name, event_id) DO UPDATE SET
        from_user_id = _owner_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    RETURN NEW;
END;
$$;


ALTER FUNCTION "private"."send_earn_withdraw_trigger_insert_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _referrer_id uuid;
begin
    -- update the referral count for the user
    insert into private.leaderboard_referrals_all_time (user_id, referrals, updated_at)
    values (NEW.referrer_id, 1, now())
    on conflict (user_id) do update set referrals = private.leaderboard_referrals_all_time.referrals + 1,
                                        updated_at = now();
    return NEW;
end
$$;


ALTER FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _referrer_id uuid;
begin
    select user_id into _referrer_id from public.send_accounts sa where decode(substring(sa.address, 3), 'hex') = NEW.referrer;
    if _referrer_id is not null then
        -- update the rewards_usdc for the user
        insert into private.leaderboard_referrals_all_time (user_id, rewards_usdc, updated_at)
        values (_referrer_id, NEW.reward, now())
        on conflict (user_id) do update set rewards_usdc = private.leaderboard_referrals_all_time.rewards_usdc + NEW.reward,
                                            updated_at   = now();
    end if;
    return NEW;
end;
$$;


ALTER FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Step 1: Get qualifying sends first
  CREATE TEMPORARY TABLE all_qualifying_sends AS
  SELECT
    *
  FROM
    sum_qualification_sends($1);
  CREATE TEMPORARY TABLE send_ceiling_settings AS
  WITH send_settings AS(
    SELECT
      minimum_sends * scaling_divisor AS divider
    FROM
      send_slash s_s
      JOIN distributions d ON d.id = s_s.distribution_id
    WHERE
      d.number = $1
),
previous_distribution AS(
  SELECT
    ds.user_id,
    CASE WHEN $1 = 11 THEN
      -- scale the amount correctly
      ds.amount * 1e16
    ELSE
      ds.amount
    END AS user_prev_shares
  FROM
    distribution_shares ds
  WHERE
    ds.distribution_id =(
      SELECT
        id
      FROM
        distributions d
      WHERE
        d.number = $1 - 1))
SELECT
  qs.user_id,
  ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) /(
      SELECT
        minimum_sends * scaling_divisor
      FROM send_slash s_s
    WHERE
      s_s.distribution_id =(
        SELECT
          id
        FROM distributions
      WHERE
        number = $1)))::numeric AS send_ceiling
FROM( SELECT DISTINCT
    user_id
  FROM
    all_qualifying_sends) qs
  CROSS JOIN(
    SELECT
      hodler_min_balance
    FROM
      distributions
    WHERE
      number = $1) d
  LEFT JOIN previous_distribution pd ON pd.user_id = qs.user_id;
  -- Step 2: Update existing verifications
  UPDATE
    distribution_verifications dv
  SET
    weight = qs.amount,
    -- Cast to text to avoid overflow errors on client
    metadata = jsonb_build_object('value', scs.send_ceiling::text, 'sent_to', qs.sent_to)
  FROM
    send_ceiling_settings scs
    JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
  WHERE
    dv.user_id = qs.user_id
    AND dv.distribution_id =(
      SELECT
        id
      FROM
        distributions
      WHERE
        number = $1)
    AND dv.type = 'send_ceiling'
    AND COALESCE(qs.amount, 0) > 0;
  -- Step 3: Insert new verifications
  INSERT INTO distribution_verifications(
    distribution_id,
    user_id,
    type,
    weight,
    metadata)
  SELECT
(
      SELECT
        id
      FROM
        distributions d
      WHERE
        d.number = $1), qs.user_id, 'send_ceiling'::public.verification_type, qs.amount,
    -- Cast to text to avoid overflow errors on client
    jsonb_build_object('value', scs.send_ceiling::text, 'sent_to', qs.sent_to)
  FROM
    send_ceiling_settings scs
    JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
  WHERE
    COALESCE(qs.amount, 0) > 0
    AND NOT EXISTS(
      SELECT
        1
      FROM
        distribution_verifications dv
      WHERE
        dv.user_id = qs.user_id
        AND dv.distribution_id =(
          SELECT
            id
          FROM
            distributions
          WHERE
            number = $1)
          AND dv.type = 'send_ceiling');
  -- Cleanup temporary tables
  DROP TABLE IF EXISTS send_ceiling_settings;
  DROP TABLE IF EXISTS all_qualifying_sends;
END;
$_$;


ALTER FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."chain_addresses_after_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create addresses for themselves';

END IF;

IF (
    SELECT COUNT(*)
    FROM public.chain_addresses
    WHERE user_id = NEW.user_id
        AND TG_OP = 'INSERT'
) > 1 THEN RAISE EXCEPTION 'User can have at most 1 address';

END IF;

RETURN NEW;

END;

$$;


ALTER FUNCTION "public"."chain_addresses_after_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  tag_owner_ids uuid[];
  distinct_user_ids int;
  tag_owner_id uuid;
  referrer_id uuid;
  _event_id alias FOR $2;
BEGIN
  -- Check if the tags exist and fetch their owners.
  SELECT
    array_agg(user_id) INTO tag_owner_ids
  FROM
    public.tags
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- If any of the tags do not exist or are not in pending status, throw an error.
  IF array_length(tag_owner_ids, 1) <> array_length(tag_names, 1) THEN
    RAISE EXCEPTION 'One or more tags do not exist or are not in pending status.';
  END IF;
  -- Check if all tags belong to the same user
  SELECT
    count(DISTINCT user_id) INTO distinct_user_ids
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF distinct_user_ids <> 1 THEN
    RAISE EXCEPTION 'Tags must belong to the same user.';
  END IF;
  -- Fetch single user_id
  SELECT DISTINCT
    user_id INTO tag_owner_id
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF event_id IS NULL OR event_id = '' THEN
    RAISE EXCEPTION 'Receipt event ID is required for paid tags.';
  END IF;
  -- Ensure event_id matches the sender
  IF (
    SELECT
      count(DISTINCT scr.sender)
    FROM
      public.sendtag_checkout_receipts scr
      JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
      scr.event_id = _event_id AND sa.user_id = tag_owner_id) <> 1 THEN
    RAISE EXCEPTION 'Receipt event ID does not match the sender';
  END IF;
  -- save receipt event_id
  INSERT INTO public.receipts(
    event_id,
    user_id)
  VALUES (
    _event_id,
    tag_owner_id);
  -- Associate the tags with the onchain event
  INSERT INTO public.tag_receipts(
    tag_name,
    event_id)
  SELECT
    unnest(tag_names),
    event_id;
  -- Confirm the tags
  UPDATE
    public.tags
  SET
    status = 'confirmed'::public.tag_status
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- Create referral code redemption (only if it doesn't exist)
  IF referral_code_input IS NOT NULL AND referral_code_input <> '' THEN
    SELECT
      id INTO referrer_id
    FROM
      public.profiles
    WHERE
      referral_code = referral_code_input;
    IF referrer_id IS NOT NULL AND referrer_id <> tag_owner_id THEN
      -- Referrer cannot be the tag owner.
      -- Check if a referral already exists for this user
      IF NOT EXISTS (
        SELECT
          1
        FROM
          public.referrals
        WHERE
          referred_id = tag_owner_id) THEN
      -- Insert only one referral for the user
      INSERT INTO public.referrals(
        referrer_id,
        referred_id)
      SELECT
        referrer_id,
        tag_owner_id
      LIMIT 1;
    END IF;
  END IF;
END IF;
END;
$_$;


ALTER FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."send_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "address" "public"."citext" NOT NULL,
    "chain_id" integer NOT NULL,
    "init_code" "bytea" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chain_addresses_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")))
);


ALTER TABLE "public"."send_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webauthn_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "raw_credential_id" "bytea" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "public_key" "bytea" NOT NULL,
    "key_type" "public"."key_type_enum" NOT NULL,
    "sign_count" bigint NOT NULL,
    "attestation_object" "bytea" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "webauthn_credentials_sign_count_check" CHECK (("sign_count" >= 0))
);


ALTER TABLE "public"."webauthn_credentials" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) RETURNS "json"
    LANGUAGE "plpgsql"
    AS $_$
declare _send_account send_accounts;

_webauthn_credential webauthn_credentials;

begin --

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

insert into send_accounts (address, chain_id, init_code)
values (
    send_account.address,
    send_account.chain_id,
    send_account.init_code
  ) on conflict (address, chain_id) do
update
set init_code = excluded.init_code
returning * into _send_account;

insert into send_account_credentials (account_id, credential_id, key_slot)
values (
    _send_account.id,
    _webauthn_credential.id,
    $3
  );

return json_build_object(
  'send_account',
  _send_account,
  'webauthn_credential',
  _webauthn_credential
);

end;

$_$;


ALTER FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) RETURNS SETOF "public"."send_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions
    WHERE
      id = distribution_id
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- return the hodler addresses that had no sells during the qualification period and have verifications
  RETURN query WITH sellers AS(
    -- find sellers during the qualification period
    SELECT
      lower(concat('0x', encode(f, 'hex')))::citext AS seller
    FROM
      distributions
      JOIN send_token_transfers ON to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start
        AND to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
      JOIN send_liquidity_pools ON send_liquidity_pools.address = send_token_transfers.t
    WHERE
      distributions.id = $1)
    -- the hodler addresses that had no sells during the qualification period and have verifications
    SELECT DISTINCT
      send_accounts.*
    FROM
      distributions
      JOIN distribution_verifications ON distribution_verifications.distribution_id = distributions.id
      JOIN send_accounts ON send_accounts.user_id = distribution_verifications.user_id
    WHERE
      distributions.id = $1
      AND send_accounts.address NOT IN(
        SELECT
          seller
        FROM
          sellers);
END;
$_$;


ALTER FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."favourite_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user -- only change is to use (select auth.uid()) instead of auth.uid()
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Count how many interactions the current user has with each counterparty
    counterparty_counts AS (
        SELECT counterparty,
               COUNT(*) AS interaction_count
        FROM user_transfers
        GROUP BY counterparty
    )

SELECT (counterparty).*
FROM counterparty_counts
ORDER BY interaction_count DESC -- Order the result by most frequent counterparties
    LIMIT 10; -- Return only the 10 most frequent counterparties

END;
$$;


ALTER FUNCTION "public"."favourite_senders"() OWNER TO "postgres";




CREATE OR REPLACE FUNCTION "public"."get_affiliate_referrals"() RETURNS TABLE("send_plus_minus" numeric, "avatar_url" "text", "tag" "public"."citext", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                COALESCE(a.send_plus_minus, 0)::numeric AS send_plus_minus,
                p.avatar_url,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
            WHERE
                r.referrer_id = auth.uid())
        SELECT
            o.send_plus_minus,
            o.avatar_url,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$$;


ALTER FUNCTION "public"."get_affiliate_referrals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_affiliate_stats_summary"() RETURNS TABLE("id" "uuid", "created_at" timestamp with time zone, "user_id" "uuid", "referral_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        SELECT
            a.id,
            a.created_at,
            a.user_id,
            COUNT(DISTINCT r.referred_id)::bigint AS referral_count
        FROM
            affiliate_stats a
                LEFT JOIN referrals r ON r.referrer_id = a.user_id
        WHERE
            a.user_id = auth.uid()
        GROUP BY
            a.id,
            a.created_at,
            a.user_id;
END;
$$;


ALTER FUNCTION "public"."get_affiliate_stats_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends"() RETURNS TABLE("avatar_url" "text", "x_username" "text", "birthday" "date", "tag" "public"."citext", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
            WHERE
                r.referrer_id = auth.uid()
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.x_username,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$$;


ALTER FUNCTION "public"."get_friends"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_jackpot_tickets_purchased"() RETURNS numeric
    LANGUAGE "sql"
    AS $$
WITH last_jackpot AS (
    -- Retrieve the maximum block number from the sendpot_jackpot_runs table.
  -- This block number represents the end of the last completed jackpot.
  -- If no jackpot runs exist, use 0 as the default value.
  SELECT COALESCE(MAX(block_num), 0) AS last_block
  FROM public.sendpot_jackpot_runs
)
SELECT COALESCE(SUM(tickets_purchased_total_bps), 0) AS total_tickets
FROM public.sendpot_user_ticket_purchases
WHERE block_num >= (SELECT last_block FROM last_jackpot);
$$;


ALTER FUNCTION "public"."get_pending_jackpot_tickets_purchased"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) RETURNS TABLE("jackpot_run_id" integer, "jackpot_block_num" numeric, "jackpot_block_time" numeric, "winner" "bytea", "win_amount" numeric, "total_tickets" numeric)
    LANGUAGE "sql"
    AS $$
WITH cte AS (
  SELECT
    r.id AS jackpot_run_id,
    r.block_num AS jackpot_block_num,
    r.block_time AS jackpot_block_time,
    r.winner,
    r.win_amount,
    -- "prev_block_num" is the block_num of the previous jackpot (or 0 if none)
    COALESCE(
      LAG(r.block_num) OVER (ORDER BY r.block_num ASC),
      0
    ) AS prev_block_num
  FROM public.sendpot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_total_bps), 0)
    FROM public.sendpot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets
FROM cte c
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$$;


ALTER FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ begin
insert into public.profiles (id)
values (new.id);

return new;

end;

$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" integer NOT NULL,
    "challenge" "bytea" DEFAULT "extensions"."gen_random_bytes"(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '00:15:00'::interval) NOT NULL
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_challenge"() RETURNS "public"."challenges"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."insert_challenge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at)
    SELECT
        (
            SELECT
                id
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1) AS distribution_id,
        sa.user_id,
        'create_passkey'::public.verification_type AS type,
        jsonb_build_object('account_created_at', sa.created_at) AS metadata,
        sa.created_at AS created_at
    FROM
        send_accounts sa
    WHERE
        sa.created_at >= (
            SELECT
                qualification_start
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        )
        AND sa.created_at <= (
            SELECT
                qualification_end
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        );
END;
$$;


ALTER FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer DEFAULT NULL::integer, "minimum_sends" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_send_slash RECORD;
BEGIN
    -- Retrieve the previous send_slash record
    SELECT * INTO prev_send_slash
    FROM public.send_slash
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_send_slash.distribution_number - 1 LIMIT 1);

    -- Use provided values or previous values or defaults
    INSERT INTO public.send_slash(
        distribution_id,
        distribution_number,
        scaling_divisor,
        minimum_sends
    ) VALUES (
        (SELECT id FROM distributions WHERE "number" = distribution_number LIMIT 1),
        insert_send_slash.distribution_number,
        COALESCE(scaling_divisor, prev_send_slash.scaling_divisor, 3),
        COALESCE(minimum_sends, prev_send_slash.minimum_sends, 50)
    );
END;
$$;


ALTER FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Perform the entire operation within a single function
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    daily_transfers AS (
        SELECT
            sa.user_id,
            DATE(to_timestamp(sat.block_time) AT TIME ZONE 'UTC') AS transfer_date,
            COUNT(DISTINCT sat.t) AS unique_recipients
        FROM
            send_account_transfers sat
            JOIN send_accounts sa ON sa.address = CONCAT('0x', ENCODE(sat.f, 'hex'))::CITEXT
        WHERE
            sat.block_time >= EXTRACT(EPOCH FROM (
                SELECT
                    qualification_start
                FROM distribution_info))
            AND sat.block_time < EXTRACT(EPOCH FROM (
                SELECT
                    qualification_end
                FROM distribution_info))
        GROUP BY
            sa.user_id,
            DATE(to_timestamp(sat.block_time) AT TIME ZONE 'UTC')
    ),
    streaks AS (
        SELECT
            user_id,
            transfer_date,
            unique_recipients,
            transfer_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date))::INTEGER AS streak_group
        FROM
            daily_transfers
        WHERE
            unique_recipients > 0
    ),
    max_streaks AS (
        SELECT
            user_id,
            MAX(streak_length) AS max_streak_length
        FROM (
            SELECT
                user_id,
                streak_group,
                COUNT(*) AS streak_length
            FROM
                streaks
            GROUP BY
                user_id,
                streak_group) AS streak_lengths
        GROUP BY
            user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        ms.user_id,
        'send_streak'::public.verification_type,
        (SELECT NOW() AT TIME ZONE 'UTC'),
        ms.max_streak_length
    FROM
        max_streaks ms
    WHERE
        ms.max_streak_length > 0;
END;
$$;


ALTER FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_send_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Perform the entire operation within a single function
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    unique_transfer_counts AS (
        SELECT
            sa.user_id,
            COUNT(DISTINCT sat.t) AS unique_recipient_count,
            MAX(to_timestamp(sat.block_time) AT TIME ZONE 'UTC') AS last_transfer_date
        FROM
            send_account_transfers sat
            JOIN send_accounts sa ON sa.address = CONCAT('0x', ENCODE(sat.f, 'hex'))::CITEXT
        WHERE
            sat.block_time >= EXTRACT(EPOCH FROM (
                SELECT
                    qualification_start
                FROM distribution_info))
            AND sat.block_time < EXTRACT(EPOCH FROM (
                SELECT
                    qualification_end
                FROM distribution_info))
        GROUP BY
            sa.user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        utc.user_id,
        type,
        JSONB_BUILD_OBJECT('value', utc.unique_recipient_count),
        LEAST(utc.last_transfer_date, (
            SELECT
                qualification_end
            FROM distribution_info)),
        CASE
            WHEN type = 'send_ten'::public.verification_type
                AND utc.unique_recipient_count >= 10 THEN 1
            WHEN type = 'send_one_hundred'::public.verification_type
                AND utc.unique_recipient_count >= 100 THEN 1
            ELSE 0
        END
    FROM
        unique_transfer_counts utc
        CROSS JOIN (
            SELECT 'send_ten'::public.verification_type AS type
            UNION ALL
            SELECT 'send_one_hundred'::public.verification_type
        ) types;
END;
$$;


ALTER FUNCTION "public"."insert_send_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_start timestamp;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_start, qualification_end INTO dist_id, qual_start, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add month referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    created_at,
    weight)
  SELECT
    dist_id,
    referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object('referred_id', referred_id),
    referrals.created_at,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = referrals.referred_id
          AND ds.distribution_id = prev_dist_id
      ) THEN 1
      ELSE 0
    END
  FROM
    referrals
  WHERE
    referrals.created_at < qual_end
    AND referrals.created_at > qual_start;
END;
$$;


ALTER FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at)
    SELECT
        (
            SELECT
                id
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1),
        user_id,
        'tag_registration'::public.verification_type,
        jsonb_build_object('tag', "name"),
        created_at
    FROM
        tags
    WHERE
        status = 'confirmed'::public.tag_status;
END;
$$;


ALTER FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_end INTO dist_id, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add total_tag_referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    created_at,
    weight)
  WITH total_referrals AS (
    SELECT
      r.referrer_id,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = r.referred_id
        AND ds.distribution_id = prev_dist_id
      )) AS qualified_referrals,
      MAX(r.created_at) AS last_referral_date
    FROM
      referrals r
    WHERE
      r.created_at <= qual_end
    GROUP BY
      r.referrer_id
  )
  SELECT
    dist_id AS distribution_id,
    tr.referrer_id AS user_id,
    'total_tag_referrals'::public.verification_type AS type,
    LEAST(tr.last_referral_date, qual_end) AS created_at,
    tr.qualified_referrals AS weight
  FROM
    total_referrals tr
  WHERE
    tr.qualified_referrals > 0;
END;
$$;


ALTER FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_create_passkey"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;
  -- Insert verification for create_passkey
  IF curr_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT
      1
    FROM
      public.distribution_verifications
    WHERE
      user_id = NEW.user_id AND distribution_id = curr_distribution_id AND type = 'create_passkey'::public.verification_type) THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      metadata,
      created_at -- Removed the extra comma here
)
    VALUES (
      curr_distribution_id,
      NEW.user_id,
      'create_passkey' ::public.verification_type,
      jsonb_build_object(
        'account_created_at', NEW.created_at),
      NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_verification_create_passkey"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;

  -- Return early if current distribution doesn't exist
  IF curr_distribution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert verification for referrer
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    weight
  )
  VALUES (
    curr_distribution_id,
    NEW.referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object(
      'referred_id', NEW.referred_id
    ),
    0
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_verification_referral"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_send_ceiling"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _user_id uuid;
  _recipient_address citext;
  _distribution_id integer;
  _distribution_number integer;
  _send_ceiling numeric;
  _verification_record record;
BEGIN
  -- Get the sender's user_id
  SELECT send_accounts.user_id INTO _user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext;

  -- Get recipient address
  _recipient_address := concat('0x', encode(NEW.t, 'hex'))::citext;

  -- Validate transaction value
  IF NEW.v <= 0 THEN
    RETURN NEW; -- Skip processing for zero or negative values
  END IF;

  -- Get the active distribution id and number
  SELECT d.id, d.number
  INTO _distribution_id, _distribution_number
  FROM distributions d
  WHERE extract(epoch FROM d.qualification_start) <= NEW.block_time
    AND extract(epoch FROM d.qualification_end) > NEW.block_time;

  -- If we found matching distribution and user
  IF _user_id IS NOT NULL AND _distribution_id IS NOT NULL THEN
    -- Try to update existing verification first
    UPDATE distribution_verifications dv
    SET
      metadata = CASE
        WHEN NOT (_recipient_address = ANY(
          ARRAY(SELECT jsonb_array_elements_text(metadata -> 'sent_to'))::citext[]
        )) THEN
          jsonb_build_object(
            'value', (metadata ->> 'value'),
            'sent_to', metadata -> 'sent_to' || jsonb_build_array(_recipient_address)
          )
        ELSE metadata
      END,
      weight = weight + CASE
        WHEN NOT (_recipient_address = ANY(
          ARRAY(SELECT jsonb_array_elements_text(metadata -> 'sent_to'))::citext[]
        )) THEN
          LEAST(NEW.v, (metadata ->> 'value')::numeric)
        ELSE 0
      END
    WHERE dv.user_id = _user_id
      AND distribution_id = _distribution_id
      AND type = 'send_ceiling'
    RETURNING metadata ->> 'value' INTO _send_ceiling;

    -- If no row was updated, create new verification
    IF NOT FOUND THEN
      -- Calculate send ceiling for new verification
      WITH send_settings AS (
        SELECT minimum_sends * scaling_divisor AS divider
        FROM send_slash s_s
        JOIN distributions d ON d.id = s_s.distribution_id
        WHERE d.number = _distribution_number
      ),
      previous_distribution AS (
        SELECT ds.user_id,
          ds.amount AS user_prev_shares
        FROM distribution_shares ds
        WHERE ds.distribution_id = (
          SELECT id
          FROM distributions
          WHERE number = _distribution_number - 1
        )
        AND ds.user_id = _user_id
      ),
      distribution_info AS (
        SELECT hodler_min_balance
        FROM distributions
        WHERE id = _distribution_id
      )
      SELECT ROUND(COALESCE(pd.user_prev_shares, di.hodler_min_balance) / NULLIF(ss.divider, 0))::numeric
      INTO _send_ceiling
      FROM distribution_info di
      CROSS JOIN send_settings ss
      LEFT JOIN previous_distribution pd ON pd.user_id = _user_id;

      -- Handle NULL or zero divider case
      IF _send_ceiling IS NULL OR _send_ceiling < 0 THEN
        RAISE NOTICE 'Invalid send ceiling calculation result: %', _send_ceiling;
        _send_ceiling := 0; -- Default fallback
      END IF;

      -- Create new verification
      INSERT INTO distribution_verifications(
        distribution_id,
        user_id,
        type,
        weight,
        metadata
      )
      VALUES (
        _distribution_id,
        _user_id,
        'send_ceiling',
        LEAST(NEW.v, _send_ceiling),
        jsonb_build_object(
          'value', _send_ceiling::text,
          'sent_to', jsonb_build_array(_recipient_address)
        )
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
    RETURN NEW; -- Continue processing even if this trigger fails
END;
$$;


ALTER FUNCTION "public"."insert_verification_send_ceiling"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_sends"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  curr_distribution_id bigint;
  from_user_id uuid;
  to_user_id uuid;
  unique_recipient_count integer;
  current_streak integer;
  existing_record_id bigint;
  ignored_addresses bytea[] := ARRAY['\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, '\x36f43082d01df4801af2d95aeed1a0200c5510ae'::bytea];
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
  ORDER BY
    qualification_start DESC
  LIMIT 1;
  -- Get user_ids from send_accounts
  SELECT
    user_id INTO from_user_id
  FROM
    send_accounts
  WHERE
    address = concat('0x', encode(NEW.f, 'hex'))::citext;
  SELECT
    user_id INTO to_user_id
  FROM
    send_accounts
  WHERE
    address = concat('0x', encode(NEW.t, 'hex'))::citext;
  IF curr_distribution_id IS NOT NULL AND from_user_id IS NOT NULL AND to_user_id IS NOT NULL THEN
    -- Count unique recipients for the sender
    SELECT
      COUNT(DISTINCT t) INTO unique_recipient_count
    FROM
      send_account_transfers
    WHERE
      f = NEW.f
      AND NOT (t = ANY (ignored_addresses))
      AND block_time >=(
        SELECT
          extract(epoch FROM qualification_start)
        FROM
          distributions
        WHERE
          id = curr_distribution_id)
      AND block_time <=(
        SELECT
          extract(epoch FROM qualification_end)
        FROM
          distributions
        WHERE
          id = curr_distribution_id);
    -- Handle send_ten verification
    SELECT
      id INTO existing_record_id
    FROM
      public.distribution_verifications
    WHERE
      distribution_id = curr_distribution_id
      AND user_id = from_user_id
      AND type = 'send_ten'::public.verification_type;
    IF existing_record_id IS NOT NULL THEN
      UPDATE
        public.distribution_verifications
      SET
        metadata = jsonb_build_object('value', unique_recipient_count),
        weight = CASE WHEN unique_recipient_count >= 10 THEN
          1
        ELSE
          0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
      WHERE
        id = existing_record_id;
    ELSE
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at)
      VALUES (
        curr_distribution_id,
        from_user_id,
        'send_ten' ::public.verification_type,
        jsonb_build_object(
          'value', unique_recipient_count),
        CASE WHEN unique_recipient_count >= 10 THEN
          1
        ELSE
          0
        END,
        to_timestamp(
          NEW.block_time) at time zone 'UTC');
    END IF;
    -- Handle send_one_hundred verification
    SELECT
      id INTO existing_record_id
    FROM
      public.distribution_verifications
    WHERE
      distribution_id = curr_distribution_id
      AND user_id = from_user_id
      AND type = 'send_one_hundred'::public.verification_type;
    IF existing_record_id IS NOT NULL THEN
      UPDATE
        public.distribution_verifications
      SET
        metadata = jsonb_build_object('value', unique_recipient_count),
        weight = CASE WHEN unique_recipient_count >= 100 THEN
          1
        ELSE
          0
        END,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
      WHERE
        id = existing_record_id;
    ELSE
      INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at)
      VALUES (
        curr_distribution_id,
        from_user_id,
        'send_one_hundred' ::public.verification_type,
        jsonb_build_object(
          'value', unique_recipient_count),
        CASE WHEN unique_recipient_count >= 100 THEN
          1
        ELSE
          0
        END,
        to_timestamp(
          NEW.block_time) at time zone 'UTC');
    END IF;
    -- Calculate current streak
    WITH daily_transfers AS (
      SELECT DISTINCT
        DATE(to_timestamp(block_time) at time zone 'UTC') AS transfer_date
      FROM
        send_account_transfers
      WHERE
        f = NEW.f
        AND block_time >=(
          SELECT
            extract(epoch FROM qualification_start)
          FROM
            distributions
          WHERE
            id = curr_distribution_id)
),
streaks AS (
  SELECT
    transfer_date,
    transfer_date -(ROW_NUMBER() OVER (ORDER BY transfer_date))::integer AS streak_group
  FROM
    daily_transfers
)
SELECT
  COUNT(*) INTO current_streak
FROM
  streaks
WHERE
  streak_group =(
    SELECT
      streak_group
    FROM
      streaks
    WHERE
      transfer_date = DATE(to_timestamp(NEW.block_time) at time zone 'UTC'));
  -- Handle send_streak verification
  SELECT
    id INTO existing_record_id
  FROM
    public.distribution_verifications
  WHERE
    distribution_id = curr_distribution_id
    AND user_id = from_user_id
    AND type = 'send_streak'::public.verification_type;
  IF existing_record_id IS NOT NULL THEN
    UPDATE
      public.distribution_verifications
    SET
      weight = GREATEST(current_streak, weight),
      created_at = to_timestamp(NEW.block_time) at time zone 'UTC'
    WHERE
      id = existing_record_id;
  ELSE
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      created_at,
      weight)
    VALUES (
      curr_distribution_id,
      from_user_id,
      'send_streak' ::public.verification_type,
      to_timestamp(
        NEW.block_time) at time zone 'UTC',
      current_streak);
  END IF;
END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."insert_verification_sends"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_tag_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare curr_distribution_id bigint;

begin --
    -- check if tag is confirmed
if NEW.status <> 'confirmed'::public.tag_status then return NEW;

end if;

curr_distribution_id := (
    select id
    from distributions
    where qualification_start <= now()
        and qualification_end >= now()
    order by qualification_start desc
    limit 1
);

if curr_distribution_id is not null
and not exists (
    select 1
    from public.distribution_verifications
    where user_id = NEW.user_id
        and metadata->>'tag' = NEW.name
        and type = 'tag_registration'::public.verification_type
) then -- insert new verification
insert into public.distribution_verifications (distribution_id, user_id, type, metadata)
values (
        (
            select id
            from distributions
            where qualification_start <= now()
                and qualification_end >= now()
            order by qualification_start desc
            limit 1
        ), NEW.user_id, 'tag_registration'::public.verification_type, jsonb_build_object('tag', NEW.name)
    );

end if;

return NEW;

end;

$$;


ALTER FUNCTION "public"."insert_verification_tag_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric DEFAULT NULL::numeric, "bips_value" integer DEFAULT NULL::integer, "multiplier_min" numeric DEFAULT NULL::numeric, "multiplier_max" numeric DEFAULT NULL::numeric, "multiplier_step" numeric DEFAULT NULL::numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prev_verification_values RECORD;
BEGIN
    SELECT * INTO prev_verification_values
    FROM public.distribution_verification_values dvv
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number - 1 LIMIT 1)
    AND dvv.type = insert_verification_value.type
    LIMIT 1;

    INSERT INTO public.distribution_verification_values(
        type,
        fixed_value,
        bips_value,
        multiplier_min,
        multiplier_max,
        multiplier_step,
        distribution_id
    ) VALUES (
        insert_verification_value.type,
        COALESCE(insert_verification_value.fixed_value, prev_verification_values.fixed_value, 0),
        COALESCE(insert_verification_value.bips_value, prev_verification_values.bips_value, 0),
        COALESCE(insert_verification_value.multiplier_min, prev_verification_values.multiplier_min),
        COALESCE(insert_verification_value.multiplier_max, prev_verification_values.multiplier_max),
        COALESCE(insert_verification_value.multiplier_step, prev_verification_values.multiplier_step),
        (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number LIMIT 1)
    );
END;
$$;


ALTER FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leaderboard_referrals_all_time"() RETURNS TABLE("rewards_usdc" numeric, "referrals" integer, "user" "public"."activity_feed_user")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    return query select l.rewards_usdc,
                        l.referrals,
                        (case when l.user_id = ( select auth.uid() ) then ( select auth.uid() ) end, -- user_id
                         p.name, -- name
                         p.avatar_url, -- avatar_url
                         p.send_id, -- send_id
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ) -- tags
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                 where p.is_public = true;
end
$$;


ALTER FUNCTION "public"."leaderboard_referrals_all_time"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") RETURNS TABLE("id" "uuid", "avatar_url" "text", "name" "text", "about" "text", "refcode" "text", "x_username" "text", "birthday" "date", "tag" "public"."citext", "address" "public"."citext", "chain_id" integer, "is_public" boolean, "sendid" integer, "all_tags" "text"[])
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    AS $$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;
return query --
select case when p.id = ( select auth.uid() ) then p.id end              as id,
       p.avatar_url::text                                                as avatar_url,
        p.name::text                                                      as name,
        p.about::text                                                     as about,
        p.referral_code                                                   as refcode,
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username, -- changed to be null if profile is private
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday, -- added birthday to return type, returns null if profile is private
       t.name                                                            as tag,
       sa.address                                                        as address,
       sa.chain_id                                                       as chain_id,
       case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end                                               as is_public,
       p.send_id                                                         as sendid,
       ( select array_agg(t.name::text)
         from tags t
         where t.user_id = p.id and t.status = 'confirmed'::tag_status ) as all_tags
from profiles p
    join auth.users a on a.id = p.id
    left join tags t on t.user_id = p.id and t.status = 'confirmed'::tag_status
    left join send_accounts sa on sa.user_id = p.id
where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
    (lookup_type = 'tag' and t.name = identifier::citext) or
    (lookup_type = 'refcode' and p.referral_code = identifier) or
    (lookup_type = 'address' and sa.address = identifier) or
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier)) -- lookup by phone number when profile is public
  and (p.is_public -- allow public profiles to be returned
   or ( select auth.uid() ) is not null -- allow profiles to be returned if the user is authenticated
   or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
    limit 1;
end;
$$;


ALTER FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") RETURNS SETOF "public"."webauthn_credentials"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT wc.*
    FROM auth.users AS u
    JOIN webauthn_credentials AS wc ON u.id = wc.user_id
    WHERE u.phone = phone_number;
$$;


ALTER FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recent_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user -- only change is to use (select auth.uid()) instead of auth.uid()
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Step 2: Assign a row number to each transfer per counterparty, ordered by most recent
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    )

SELECT (counterparty).*  -- Return only the counterparty details
FROM numbered
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
    LIMIT 10;                     -- Return only the 10 most recent counterparties

END;
$$;


ALTER FUNCTION "public"."recent_senders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."referrals_delete_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  delete
    from activity
    where exists (
      select 1
        from OLD_TABLE
        where activity.from_user_id = OLD_TABLE.referrer_id
          and activity.to_user_id = OLD_TABLE.referred_id
          and activity.event_name = 'referrals'
      );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."referrals_delete_activity_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."referrals_insert_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select 'referrals',
           private.generate_referral_event_id(NEW_TABLE.referrer_id, NEW_TABLE.referred_id),
           NEW_TABLE.referrer_id,
           NEW_TABLE.referred_id,
           jsonb_build_object('tags', (
             select array_agg(name)
             from tags
             where user_id = NEW_TABLE.referred_id
               and status = 'confirmed'
           )),
           current_timestamp
    from NEW_TABLE
    group by NEW_TABLE.referrer_id, NEW_TABLE.referred_id;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."referrals_insert_activity_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."referrer_lookup"("referral_code" "text" DEFAULT NULL::"text") RETURNS TABLE("referrer" "public"."profile_lookup_result", "new_referrer" "public"."profile_lookup_result")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."referrer_lookup"("referral_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_receives_delete_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity where event_name = 'send_account_receives' and event_id = OLD.event_id;
    return OLD;
end;
$$;


ALTER FUNCTION "public"."send_account_receives_delete_activity_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_receives_insert_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data      jsonb;
begin
    -- select send_account_receives.event_id into _f_user_id;
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.sender, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.log_addr, 'hex'))::citext;

    _data := jsonb_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        -- cast value to text to avoid losing precision when converting to json when sending to clients
        'value', NEW.value::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_receives',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;


ALTER FUNCTION "public"."send_account_receives_insert_activity_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete
    from activity
    where event_id = OLD.event_id
      and event_name = 'send_account_signing_key_added';
    return OLD;
end;
$$;


ALTER FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr', NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key',json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_added
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_added',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = null,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;


ALTER FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity where event_id = OLD.event_id and event_name = 'send_account_signing_key_removed';
    return OLD;
end;
$$;


ALTER FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr',
        NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key', json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_removed
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_removed',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
                                                     to_user_id   = null,
                                                     data         = _data,
                                                     created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;


ALTER FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_transfers_delete_temporal_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    paymaster bytea = '\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea;
    workflow_ids text[];
begin
    -- Check if it's from or to paymaster
    if (NEW.f is not null and NEW.f = paymaster) or
       (NEW.t is not null and NEW.t = paymaster) then
        return NEW;
    end if;
    -- Only proceed with deletions if we have workflow IDs
    delete from public.activity a
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id in (select t_sat.workflow_id
                         from temporal.send_account_transfers t_sat
                         where t_sat.created_at_block_num <= NEW.block_num
                           and t_sat.status != 'failed');
    return NEW;
end;
$$;


ALTER FUNCTION "public"."send_account_transfers_delete_temporal_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_transfers_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete
    from activity
    where event_id = OLD.event_id
        and event_name = 'send_account_transfers';
    return OLD;
end;
$$;


ALTER FUNCTION "public"."send_account_transfers_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_account_transfers_trigger_insert_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
begin
    -- select send app info for from address
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

    -- cast v to text to avoid losing precision when converting to json when sending to clients
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'f', NEW.f,
        't', NEW.t,
        'v', NEW.v::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_transfers',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;


ALTER FUNCTION "public"."send_account_transfers_trigger_insert_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) RETURNS "public"."webauthn_credentials"
    LANGUAGE "plpgsql"
    AS $_$
#variable_conflict use_column
declare
    _webauthn_credential webauthn_credentials;
    _key_slot alias for $3;
begin

    if ( select count(*) from send_accounts where id = send_account_id ) = 0 then
        raise exception 'Send account not found for ID %', send_account_id;
    end if;

    -- insert the credential
    insert into webauthn_credentials (name,
                                      display_name,
                                      raw_credential_id,
                                      public_key,
                                      sign_count,
                                      attestation_object,
                                      key_type)
    values (webauthn_credential.name,
            webauthn_credential.display_name,
            webauthn_credential.raw_credential_id,
            webauthn_credential.public_key,
            webauthn_credential.sign_count,
            webauthn_credential.attestation_object,
            webauthn_credential.key_type)
    returning * into _webauthn_credential;

    -- associate the credential with the send account replacing any existing credential with the same key slot
    insert into send_account_credentials (account_id, credential_id, key_slot)
    values (send_account_id,
            _webauthn_credential.id,
            _key_slot)
    on conflict (account_id, key_slot)
    do update set credential_id = _webauthn_credential.id, key_slot = _key_slot;

    -- return the result using the custom type
    return _webauthn_credential;
end;
$_$;


ALTER FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_accounts_after_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN -- Ensure that a user does not exceed the send_accounts limit
    IF (
           SELECT COUNT(*)
           FROM public.send_accounts
           WHERE user_id = NEW.user_id
       ) > 1 THEN RAISE EXCEPTION 'User can have at most 1 send account';

    END IF;

    RETURN NEW;

END;

$$;


ALTER FUNCTION "public"."send_accounts_after_insert"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_earn_create" (
    "id" bigint NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "send_earn" "bytea" NOT NULL,
    "caller" "bytea" NOT NULL,
    "initial_owner" "bytea" NOT NULL,
    "vault" "bytea" NOT NULL,
    "fee_recipient" "bytea" NOT NULL,
    "collections" "bytea" NOT NULL,
    "fee" numeric NOT NULL,
    "salt" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_earn_create" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_earn_new_affiliate" (
    "id" bigint NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "affiliate" "bytea" NOT NULL,
    "send_earn_affiliate" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_earn_new_affiliate" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") RETURNS SETOF "public"."send_earn_create"
    LANGUAGE "sql" STABLE ROWS 1
    AS $_$
select * from send_earn_create where fee_recipient = $1.send_earn_affiliate
$_$;


ALTER FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;


ALTER FUNCTION "public"."set_current_timestamp_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stop_change_send_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN

  IF OLD.send_id <> NEW.send_id THEN
    RAISE EXCEPTION 'send_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."stop_change_send_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sum_qualification_sends"("distribution_number" integer) RETURNS TABLE("user_id" "uuid", "amount" numeric, "sent_to" "public"."citext"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  -- Create temporary table to store qualification period
  CREATE TEMPORARY TABLE IF NOT EXISTS qual_period AS
  SELECT
    extract(epoch FROM qualification_start) AS start_time,
    extract(epoch FROM qualification_end) AS end_time
  FROM
    distributions
  WHERE
    number = $1;
  -- Create temporary table for first sends to each address
  CREATE TEMPORARY TABLE first_sends AS SELECT DISTINCT ON(sa.user_id, concat('0x', encode(stt.t, 'hex')
)::citext) sa.user_id,
  concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
  stt.v AS send_amount, -- Store full amount, will cap later
  stt.block_time
FROM
  send_token_transfers stt
  JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
  CROSS JOIN qual_period qp
WHERE
  stt.block_time >= qp.start_time
    AND stt.block_time < qp.end_time
  UNION
  SELECT DISTINCT ON(sa.user_id, concat('0x', encode(stt.t, 'hex')
)::citext) sa.user_id,
  concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
  CASE WHEN $1 = 11 THEN
    -- scale the amount correctly for distribution 11
    stt.v * 1e16
  ELSE
    stt.v
  END AS send_amount, -- Store full amount, will cap later
  stt.block_time
FROM
  send_token_v0_transfers stt
  JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
  CROSS JOIN qual_period qp
WHERE
  stt.block_time >= qp.start_time
    AND stt.block_time < qp.end_time;
  -- Create index for performance
  CREATE INDEX ON first_sends(user_id);
  -- Create send_ceiling_settings table
  CREATE TEMPORARY TABLE send_ceiling_settings AS
  WITH previous_distribution AS(
    SELECT
      ds.user_id,
      CASE WHEN $1 = 11 THEN
        -- scale the amount correctly for distribution 11
        ds.amount * 1e16
      ELSE
        ds.amount
      END AS user_prev_shares
    FROM
      distribution_shares ds
      JOIN distributions d ON d.id = ds.distribution_id
    WHERE
      d.number = $1 - 1
)
  SELECT
    fs.user_id,
    ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) /(
        SELECT
          minimum_sends * scaling_divisor
        FROM send_slash s_s
        WHERE
          s_s.distribution_id =(
            SELECT
              id
            FROM distributions
          WHERE
            number = $1)))::numeric AS send_ceiling
  FROM( SELECT DISTINCT
      first_sends.user_id
    FROM
      first_sends) fs
  CROSS JOIN(
    SELECT
      hodler_min_balance
    FROM
      distributions
    WHERE
      number = $1) d
  LEFT JOIN previous_distribution pd ON pd.user_id = fs.user_id;
  -- Return aggregated results with per-user send ceiling
  RETURN QUERY
  SELECT
    fs.user_id,
    SUM(LEAST(fs.send_amount, scs.send_ceiling)) AS amount,
    array_agg(fs.recipient) AS sent_to
  FROM
    first_sends fs
    JOIN send_ceiling_settings scs ON fs.user_id = scs.user_id
  GROUP BY
    fs.user_id;
  -- Cleanup
  DROP TABLE IF EXISTS qual_period;
  DROP TABLE IF EXISTS first_sends;
  DROP TABLE IF EXISTS send_ceiling_settings;
END;
$_$;


ALTER FUNCTION "public"."sum_qualification_sends"("distribution_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tag_receipts_insert_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity
    where event_name = 'tag_receipt_usdc'
      and event_id in (select event_id from NEW_TABLE);

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        t.user_id,
        null,
        json_build_object(
                'log_addr',
                scr.log_addr,
                'block_num',
                scr.block_num,
                'tx_idx',
                scr.tx_idx,
                'log_idx',
                scr.log_idx,
                'tx_hash',
                scr.tx_hash,
                'tags',
                array_agg(t.name),
                'value',
            -- cast amount to text to avoid losing precision when converting to json when sending to clients
                scr.amount::text
        ),
        current_timestamp
    from NEW_TABLE
             join tags t on t.name = NEW_TABLE.tag_name
             join sendtag_checkout_receipts scr ON NEW_TABLE.event_id = scr.event_id
    group by t.user_id, NEW_TABLE.event_id, scr.event_id, scr.log_addr, scr.block_num, scr.tx_idx, scr.log_idx,  scr.tx_hash, scr.amount;

    return NULL;
end;
$$;


ALTER FUNCTION "public"."tag_receipts_insert_activity_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) RETURNS TABLE("send_id_matches" "public"."tag_search_result"[], "tag_matches" "public"."tag_search_result"[], "phone_matches" "public"."tag_search_result"[])
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    AS $_$
begin
    if limit_val is null or (limit_val <= 0 or limit_val > 100) then
        raise exception 'limit_val must be between 1 and 100';
    end if;
    if offset_val is null or offset_val < 0 then
        raise exception 'offset_val must be greater than or equal to 0';
    end if;
    return query --
        select ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                left join tags t on t.user_id = p.id and t.status = 'confirmed'
                        where query similar to '\d+'
                          and p.send_id::varchar like '%' || query || '%'
                        order by p.send_id
                        limit limit_val offset offset_val ) sub ) as send_id_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                join tags t on t.user_id = p.id
                        where t.status = 'confirmed'
                          and (t.name <<-> query < 0.7 or t.name ilike '%' || query || '%')
                        order by (t.name <-> query)
                        limit limit_val offset offset_val ) sub ) as tag_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, u.phone
                        from profiles p
                                 left join tags t on t.user_id = p.id and t.status = 'confirmed'
                                 join auth.users u on u.id = p.id
                        where p.is_public
                          and query ~ '^\d{8,}$'
                          and u.phone like query || '%'
                        order by u.phone
                        limit limit_val offset offset_val ) sub ) as phone_matches;
end;
$_$;


ALTER FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "name" "public"."citext" NOT NULL,
    "status" "public"."tag_status" DEFAULT 'pending'::"public"."tag_status" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tags_name_check" CHECK (((("length"(("name")::"text") >= 1) AND ("length"(("name")::"text") <= 20)) AND ("name" OPERATOR("public".~) '^[A-Za-z0-9_]+$'::"public"."citext")))
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tags"("public"."profiles") RETURNS SETOF "public"."tags"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM tags WHERE user_id = $1.id
$_$;


ALTER FUNCTION "public"."tags"("public"."profiles") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tags_after_insert_or_update_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN -- Ensure that a user does not exceed the tag limit
    IF (
        SELECT COUNT(*)
        FROM public.tags
        WHERE user_id = NEW.user_id
            AND TG_OP = 'INSERT'
    ) > 5 THEN RAISE EXCEPTION 'User can have at most 5 tags';

END IF;

RETURN NEW;

END;

$$;


ALTER FUNCTION "public"."tags_after_insert_or_update_func"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tags_before_insert_or_update_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    -- Ensure users can only insert or update their own tags
    if new.user_id <> auth.uid() then
        raise exception 'Users can only create or modify tags for themselves';

    end if;
    -- Ensure user is not changing their confirmed tag name
    if new.status = 'confirmed'::public.tag_status and old.name <> new.name and
	current_setting('role')::text = 'authenticated' then
        raise exception 'Users cannot change the name of a confirmed tag';

    end if;
    -- Ensure user is not confirming their own tag
    if new.status = 'confirmed'::public.tag_status and current_setting('role')::text =
	'authenticated' then
        raise exception 'Users cannot confirm their own tags';

    end if;
    -- Ensure no existing pending tag with same name within the last 30 minutes by another user
    if exists(
        select
            1
        from
            public.tags
        where
            name = new.name
            and status = 'pending'::public.tag_status
            and(NOW() - created_at) < INTERVAL '30 minutes'
            and user_id != new.user_id) then
    raise exception 'Tag with same name already exists';

end if;
    -- Delete older pending tags if they belong to the same user, to avoid duplicates
    delete from public.tags
    where name = new.name
        and user_id != new.user_id
        and status = 'pending'::public.tag_status;
    -- Return the new record to be inserted or updated
    return NEW;

end;

$$;


ALTER FUNCTION "public"."tags_before_insert_or_update_func"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."today_birthday_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
RETURN QUERY
SELECT (
   (
    NULL,
    p.name,
    p.avatar_url,
    p.send_id,
    (
        SELECT ARRAY_AGG(name)
        FROM tags
        WHERE user_id = p.id
          AND status = 'confirmed'
    )
       )::activity_feed_user
).*
FROM profiles p
WHERE is_public = TRUE
  AND p.birthday IS NOT NULL
  AND p.avatar_url IS NOT NULL
  AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE);
END;
$$;


ALTER FUNCTION "public"."today_birthday_senders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_affiliate_stats_on_transfer"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  sender_id uuid;
  receiver_id uuid;
  transfer_amount numeric;
BEGIN
  -- Get sender and receiver user_ids
  SELECT
    sa.user_id INTO sender_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;
  SELECT
    sa.user_id INTO receiver_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.t, 'hex'))::citext;
  transfer_amount := NEW.v::numeric;
  -- Update sender's stats (now increment)
  IF sender_id IS NOT NULL THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = sender_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus + transfer_amount
    WHERE
      user_id = sender_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      sender_id,
      transfer_amount);
  END IF;
END IF;
  -- Update receiver's stats (now decrement) if not from referrer
  IF receiver_id IS NOT NULL THEN
    -- Check if sender is not the receiver's referrer
    IF NOT EXISTS (
      SELECT
        1
      FROM
        referrals r
        INNER JOIN send_accounts sa ON sa.user_id = r.referrer_id
      WHERE
        r.referred_id = receiver_id
        AND sa.address = concat('0x', encode(NEW.f, 'hex'))::citext) THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = receiver_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus - transfer_amount
    WHERE
      user_id = receiver_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      receiver_id,
      - transfer_amount);
  END IF;
END IF;
END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_affiliate_stats_on_transfer"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distribution_shares" (
    "id" integer NOT NULL,
    "distribution_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" "public"."citext" NOT NULL,
    "amount" numeric NOT NULL,
    "hodler_pool_amount" numeric NOT NULL,
    "bonus_pool_amount" numeric NOT NULL,
    "fixed_pool_amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "index" bigint NOT NULL,
    CONSTRAINT "distribution_shares_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")))
);


ALTER TABLE "public"."distribution_shares" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- validate shares are greater than 0
  IF(
    SELECT
      count(*)
    FROM
      unnest(shares) shares
    WHERE
      shares.amount <= 0) > 0 THEN
    RAISE EXCEPTION 'Shares must be greater than 0.';
  END IF;
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions d
    WHERE
      d.id = $1
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- validate shares are for the correct distribution
  IF(
    SELECT
      count(DISTINCT id)
    FROM
      distributions
    WHERE
      id IN(
      SELECT
        shares.distribution_id
      FROM
        unnest(shares) shares)) <> 1 THEN
    RAISE EXCEPTION 'Shares are for the wrong distribution.';
  END IF;
  -- delete existing shares
  DELETE FROM distribution_shares
  WHERE distribution_shares.distribution_id = $1;
  -- insert new shares
  INSERT INTO distribution_shares(
    distribution_id,
    user_id,
    address,
    amount,
    hodler_pool_amount,
    bonus_pool_amount,
    fixed_pool_amount,
    "index")
  SELECT
    update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() OVER(PARTITION BY update_distribution_shares.distribution_id ORDER BY shares.address) - 1 AS "index"
  FROM
    unnest(shares) shares
ORDER BY
  shares.address;
END;
$_$;


ALTER FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
    -- Create temporary table for shares to avoid repeated unnesting - O(x)
    CREATE TEMPORARY TABLE temp_shares ON COMMIT DROP AS
    SELECT DISTINCT user_id
    FROM unnest(shares) ds
    WHERE ds.distribution_id = $1;

    -- Create index for better join performance - O(x log(x))
    CREATE INDEX ON temp_shares(user_id);

    -- Create temporary table for referrers and their counts - O(x log(y))
    CREATE TEMPORARY TABLE temp_referrers ON COMMIT DROP AS
    SELECT
        r.referrer_id,
        COUNT(ts.user_id) as referral_count
    FROM temp_shares ts
    JOIN referrals r ON r.referred_id = ts.user_id
    GROUP BY r.referrer_id;

    -- Single operation combining both updates and inserts - O(x log(y))
    INSERT INTO public.distribution_verifications (
        distribution_id,
        user_id,
        type,
        weight
    )
    SELECT
        $1,
        tr.referrer_id,
        'tag_referral'::verification_type,
        1
    FROM temp_referrers tr
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.user_id = tr.referrer_id
        AND dv.type = 'tag_referral'
    )
    UNION ALL
    SELECT
        $1,
        tr.referrer_id,
        'total_tag_referrals'::verification_type,
        tr.referral_count
    FROM temp_referrers tr
    WHERE NOT EXISTS (
        SELECT 1
        FROM distribution_verifications dv
        WHERE dv.distribution_id = $1
        AND dv.user_id = tr.referrer_id
        AND dv.type = 'total_tag_referrals'
    );

    -- Update existing verifications - O(x log(y))
    UPDATE distribution_verifications dv
    SET weight = tr.referral_count
    FROM temp_referrers tr
    WHERE dv.distribution_id = $1
    AND dv.user_id = tr.referrer_id
    AND dv.type = 'total_tag_referrals';

    -- Cleanup
    DROP TABLE temp_shares;
    DROP TABLE temp_referrers;
END;
$_$;


ALTER FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transfer_activity_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    note text;
    temporal_event_id text;
BEGIN
    IF (
    NEW.event_name = 'send_account_transfers'
    OR NEW.event_name = 'send_account_receives'
    )
    AND NEW.from_user_id IS NOT NULL
    AND NEW.to_user_id IS NOT NULL
    THEN
        SELECT
            data->>'note',
            t_sat.workflow_id INTO note, temporal_event_id
        FROM temporal.send_account_transfers t_sat
        WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id
        AND t_sat.send_account_transfers_activity_event_name = NEW.event_name;

        IF note IS NOT NULL THEN
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- Delete any temporal activity that might exist
        IF temporal_event_id IS NOT NULL THEN
            DELETE FROM public.activity
            WHERE event_id = temporal_event_id
            AND event_name = 'temporal_send_account_transfers';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_transfer_activity_before_insert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_referrals_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
return (select count(*) from referrals
where referrer_id=auth.uid());
end;$$;


ALTER FUNCTION "public"."user_referrals_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.status != 'confirmed' OR NOT (NEW.data ? 'note') THEN
      RETURN NEW;
  END IF;


  UPDATE public.activity
  SET data = data || jsonb_build_object('note', NEW.data->>'note')
  WHERE event_name = NEW.data->>'event_name'
  AND event_id = NEW.data->>'event_id';

  RETURN NEW;
END;
$$;


ALTER FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  inserted_activity_id BIGINT;
  owner_user_id UUID;
  activity_data jsonb;
BEGIN
  -- Only attempt to find user_id if owner is provided
  IF NEW.owner IS NULL THEN
    -- Skip activity creation if no owner is available yet
    -- The workflow will update the record with owner later
    RETURN NULL;
  END IF;

  -- Attempt to find the user_id based on the owner address
  -- Requires SELECT permission on public.send_accounts for the function executor (service_role or postgres)
  SELECT user_id INTO owner_user_id
  FROM public.send_accounts
  WHERE address = concat('0x', encode(NEW.owner, 'hex'))::citext
  LIMIT 1;

  IF owner_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build data object with only available fields
  activity_data := jsonb_build_object('workflow_id', NEW.workflow_id);

  -- Add fields if they're not null
  IF NEW.owner IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('owner', NEW.owner);
  END IF;

  IF NEW.assets IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('assets', NEW.assets::text);
  END IF;

  IF NEW.vault IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('vault', NEW.vault);
  END IF;

  -- Insert into public.activity
  INSERT INTO public.activity (event_name, event_id, data, from_user_id)
  VALUES (
    'temporal_send_earn_deposit',
    NEW.workflow_id,
    activity_data,
    owner_user_id
  )
  RETURNING id INTO inserted_activity_id;

  -- Update the temporal.send_earn_deposits row with the new activity_id
  UPDATE temporal.send_earn_deposits
  SET activity_id = inserted_activity_id
  WHERE workflow_id = NEW.workflow_id;

  RETURN NULL; -- AFTER triggers should return NULL
END;
$$;


ALTER FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_data jsonb;
BEGIN
  -- Check if status actually changed and if activity_id exists
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.activity_id IS NOT NULL THEN

    -- If the new status is 'failed'
    IF NEW.status = 'failed' THEN
      -- Prepare the updated data JSONB
      -- Start with existing data and add/overwrite status and error
      -- Ensure we handle potential NULL existing data gracefully
      SELECT COALESCE(a.data, '{}'::jsonb) || jsonb_build_object(
                          'status', 'failed',
                          'error_message', NEW.error_message
                      )
      INTO updated_data
      FROM public.activity a
      WHERE a.id = NEW.activity_id;

      -- Update the corresponding activity record only if it was found
      IF FOUND THEN
          UPDATE public.activity
          SET
            event_name = 'temporal_send_earn_deposit',
            data = updated_data,
            -- Use the timestamp from the temporal table update
            created_at = NEW.updated_at -- Reflects the failure time
          WHERE id = NEW.activity_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW; -- Result is ignored for AFTER triggers, but required syntax
END;
$$;


ALTER FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = OLD.workflow_id;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."temporal_transfer_after_upsert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _to_user_id uuid;
  _data jsonb;
BEGIN
    -- Do nothing if we haven't sent the transfer yet
    IF NEW.status = 'initialized' THEN
        RETURN NEW;
    END IF;

    -- Update send_account_transfers activity with note
    IF NEW.status = 'confirmed' THEN
        IF EXISTS (
            SELECT 1 FROM public.activity a
            WHERE event_name = NEW.send_account_transfers_activity_event_name
            AND event_id = NEW.send_account_transfers_activity_event_id
        ) THEN
            IF NEW.data ? 'note' THEN
                UPDATE public.activity a
                SET data = a.data || jsonb_build_object('note', NEW.data->>'note')
                WHERE event_name = NEW.send_account_transfers_activity_event_name
                AND event_id = NEW.send_account_transfers_activity_event_id;
            END IF;

            DELETE FROM public.activity
            WHERE event_id = NEW.workflow_id
            AND event_name = 'temporal_send_account_transfers';

            RETURN NEW;
        END IF;
    END IF;

    -- Do nothing if we have already indexed the transfer and its not failed
    IF NEW.status != 'failed' AND NEW.created_at_block_num <= (
        SELECT block_num
        FROM public.send_account_transfers
        ORDER BY block_num DESC
        LIMIT 1
    ) THEN
        RETURN NEW;
    END IF;

    -- token transfers
    IF NEW.data ? 't' THEN
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'f', NEW.data->>'f',
            't', NEW.data->>'t',
            'v', NEW.data->>'v',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    -- eth transfers
    ELSE
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'sender', NEW.data->>'sender',
            'value', NEW.data->>'value',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    END IF;

    _data := jsonb_strip_nulls(_data);

    INSERT INTO activity(
        event_name,
        event_id,
        from_user_id,
        to_user_id,
        data
    )
    VALUES (
        'temporal_send_account_transfers',
        NEW.workflow_id,
        NEW.user_id,
        _to_user_id,
        _data
    )
    ON CONFLICT (event_name, event_id)
    DO UPDATE SET
        data = EXCLUDED.data;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "temporal"."temporal_transfer_after_upsert"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "temporal"."temporal_transfer_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _user_id uuid;
  _address text;
BEGIN
  IF NEW.data ? 'f' THEN
    _address := concat('0x', encode((NEW.data->>'f')::bytea, 'hex'));
  ELSIF NEW.data ? 'sender' THEN
    _address := concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'));
  ELSE
    RAISE NOTICE E'No sender address. workflow_id: %\n', NEW.workflow_id;
    RETURN NEW;
  END IF;

  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address = _address::citext;

  IF _user_id IS NULL THEN
    RAISE NOTICE E'No user found for address: %, workflow_id: %\n', _address, NEW.workflow_id;
    RETURN NEW;
  END IF;

  NEW.user_id = _user_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "temporal"."temporal_transfer_before_insert"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "private"."leaderboard_referrals_all_time" (
    "user_id" "uuid" NOT NULL,
    "referrals" integer DEFAULT 0,
    "rewards_usdc" numeric DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "private"."leaderboard_referrals_all_time" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity" (
    "id" integer NOT NULL,
    "event_name" "text" NOT NULL,
    "event_id" character varying(255) NOT NULL,
    "from_user_id" "uuid",
    "to_user_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."activity_feed" WITH ("security_barrier"='on') AS
 SELECT "a"."created_at",
    "a"."event_name",
        CASE
            WHEN ("a"."from_user_id" = "from_p"."id") THEN ROW(
            CASE
                WHEN ("a"."from_user_id" = ( SELECT "auth"."uid"() AS "uid")) THEN ( SELECT "auth"."uid"() AS "uid")
                ELSE NULL::"uuid"
            END, "from_p"."name", "from_p"."avatar_url", "from_p"."send_id", (( SELECT "array_agg"("tags"."name") AS "array_agg"
               FROM "public"."tags"
              WHERE (("tags"."user_id" = "from_p"."id") AND ("tags"."status" = 'confirmed'::"public"."tag_status"))))::"text"[])::"public"."activity_feed_user"
            ELSE NULL::"public"."activity_feed_user"
        END AS "from_user",
        CASE
            WHEN ("a"."to_user_id" = "to_p"."id") THEN ROW(
            CASE
                WHEN ("a"."to_user_id" = ( SELECT "auth"."uid"() AS "uid")) THEN ( SELECT "auth"."uid"() AS "uid")
                ELSE NULL::"uuid"
            END, "to_p"."name", "to_p"."avatar_url", "to_p"."send_id", (( SELECT "array_agg"("tags"."name") AS "array_agg"
               FROM "public"."tags"
              WHERE (("tags"."user_id" = "to_p"."id") AND ("tags"."status" = 'confirmed'::"public"."tag_status"))))::"text"[])::"public"."activity_feed_user"
            ELSE NULL::"public"."activity_feed_user"
        END AS "to_user",
    "a"."data"
   FROM (("public"."activity" "a"
     LEFT JOIN "public"."profiles" "from_p" ON (("a"."from_user_id" = "from_p"."id")))
     LEFT JOIN "public"."profiles" "to_p" ON (("a"."to_user_id" = "to_p"."id")))
  WHERE (("a"."from_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("a"."to_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("a"."event_name" !~~ 'temporal_%'::"text")))
  GROUP BY "a"."created_at", "a"."event_name", "a"."from_user_id", "a"."to_user_id", "from_p"."id", "from_p"."name", "from_p"."avatar_url", "from_p"."send_id", "to_p"."id", "to_p"."name", "to_p"."avatar_url", "to_p"."send_id", "a"."data";


ALTER TABLE "public"."activity_feed" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."activity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."activity_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."activity_id_seq" OWNED BY "public"."activity"."id";



CREATE TABLE IF NOT EXISTS "public"."affiliate_stats" (
    "user_id" "uuid",
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "send_plus_minus" numeric DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."affiliate_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chain_addresses" (
    "address" "public"."citext" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chain_addresses_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")))
);


ALTER TABLE "public"."chain_addresses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."challenges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."challenges_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."challenges_id_seq" OWNED BY "public"."challenges"."id";



CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "referrals_different_referrer_and_referred" CHECK (("referrer_id" <> "referred_id"))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_account_credentials" (
    "account_id" "uuid" NOT NULL,
    "credential_id" "uuid" NOT NULL,
    "key_slot" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_credentials_key_slot_check" CHECK ((("key_slot" >= 0) AND ("key_slot" <= 255)))
);


ALTER TABLE "public"."send_account_credentials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_account_transfers" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "f" "bytea" NOT NULL,
    "t" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_account_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_token_transfers" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "f" "bytea" NOT NULL,
    "t" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_token_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sendtag_checkout_receipts" (
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text") || '/'::"text") || ("abi_idx")::"text")) STORED NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "amount" numeric NOT NULL,
    "referrer" "bytea" NOT NULL,
    "reward" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL
);


ALTER TABLE "public"."sendtag_checkout_receipts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_metrics" AS
 WITH "time_window" AS (
         SELECT EXTRACT(epoch FROM ("now"() - '24:00:00'::interval)) AS "cutoff_time"
        ), "daily_transfers" AS (
         SELECT "t"."f",
            "t"."t",
            "t"."log_addr",
            "t"."v",
            "t"."block_time"
           FROM "public"."send_account_transfers" "t",
            "time_window" "tw"
          WHERE ("t"."block_time" >= "tw"."cutoff_time")
        ), "recent_transfers" AS (
         SELECT "t"."f" AS "from_addr",
            "t"."t" AS "to_addr",
            "t"."log_addr",
            "t"."v" AS "amount",
            "t"."block_time",
                CASE
                    WHEN ("t"."log_addr" = "decode"('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::"text", 'hex'::"text")) THEN ("t"."v" / 1000000.0)
                    ELSE (0)::numeric
                END AS "usdc_amount",
                CASE
                    WHEN ("t"."log_addr" = ANY (ARRAY["decode"('3f14920c99beb920afa163031c4e47a3e03b3e4a'::"text", 'hex'::"text"), "decode"('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::"text", 'hex'::"text")])) THEN ("t"."v" / 1000000000000000000.0)
                    ELSE (0)::numeric
                END AS "send_amount"
           FROM "daily_transfers" "t"
        ), "account_mapping" AS (
         SELECT "rt"."from_addr",
            "rt"."to_addr",
            "rt"."log_addr",
            "rt"."amount",
            "rt"."block_time",
            "rt"."usdc_amount",
            "rt"."send_amount",
            "p_from"."id" AS "from_profile_id",
            "p_to"."id" AS "to_profile_id"
           FROM (((("recent_transfers" "rt"
             LEFT JOIN "public"."send_accounts" "sa_from" ON ((("lower"("concat"('0x', "encode"("rt"."from_addr", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) "sa_from"."address")))
             LEFT JOIN "public"."profiles" "p_from" ON (("p_from"."id" = "sa_from"."user_id")))
             LEFT JOIN "public"."send_accounts" "sa_to" ON ((("lower"("concat"('0x', "encode"("rt"."to_addr", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) "sa_to"."address")))
             LEFT JOIN "public"."profiles" "p_to" ON (("p_to"."id" = "sa_to"."user_id")))
        ), "ip_transfer_data" AS (
         SELECT "s"."ip" AS "ip_address",
            "r"."ip" AS "to_ip",
                CASE
                    WHEN ("am"."log_addr" = "decode"('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::"text", 'hex'::"text")) THEN 'USDC'::"text"
                    WHEN ("am"."log_addr" = ANY (ARRAY["decode"('3f14920c99beb920afa163031c4e47a3e03b3e4a'::"text", 'hex'::"text"), "decode"('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::"text", 'hex'::"text")])) THEN 'SEND'::"text"
                    ELSE 'UNKNOWN'::"text"
                END AS "currency",
            "sum"(
                CASE
                    WHEN ("am"."log_addr" = "decode"('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::"text", 'hex'::"text")) THEN "am"."usdc_amount"
                    ELSE (0)::numeric
                END) AS "amount",
            ("count"(*))::integer AS "tx_count"
           FROM (("account_mapping" "am"
             LEFT JOIN LATERAL ( SELECT "sessions"."ip"
                   FROM "auth"."sessions"
                  WHERE (("sessions"."user_id" = ( SELECT "profiles"."id"
                           FROM "public"."profiles"
                          WHERE ("profiles"."id" = ( SELECT "send_accounts"."user_id"
                                   FROM "public"."send_accounts"
                                  WHERE ("send_accounts"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("am"."from_addr", 'hex'::"text"))))::"public"."citext"))))) AND ("sessions"."created_at" <= "to_timestamp"(("am"."block_time")::double precision)))
                  ORDER BY "sessions"."created_at" DESC
                 LIMIT 1) "s" ON (true))
             LEFT JOIN LATERAL ( SELECT "sessions"."ip"
                   FROM "auth"."sessions"
                  WHERE (("sessions"."user_id" = ( SELECT "profiles"."id"
                           FROM "public"."profiles"
                          WHERE ("profiles"."id" = ( SELECT "send_accounts"."user_id"
                                   FROM "public"."send_accounts"
                                  WHERE ("send_accounts"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("am"."to_addr", 'hex'::"text"))))::"public"."citext"))))) AND ("sessions"."created_at" <= "to_timestamp"(("am"."block_time")::double precision)) AND ("sessions"."created_at" >= "to_timestamp"((("am"."block_time" - (86400)::numeric))::double precision)))
                  ORDER BY "sessions"."created_at" DESC
                 LIMIT 1) "r" ON (true))
          WHERE ("s"."ip" IS NOT NULL)
          GROUP BY "s"."ip", "r"."ip", "am"."log_addr"
        ), "top_all_ips" AS (
         SELECT "ip_transfer_data"."ip_address",
            "json_agg"("json_build_object"('to_ip', "ip_transfer_data"."to_ip", 'currency', "ip_transfer_data"."currency", 'amount', "ip_transfer_data"."amount")) AS "transfer_data",
            "sum"("ip_transfer_data"."tx_count") AS "tx_count"
           FROM "ip_transfer_data"
          GROUP BY "ip_transfer_data"."ip_address"
          ORDER BY ("sum"("ip_transfer_data"."tx_count")) DESC
        )
 SELECT ( SELECT ("count"(DISTINCT "send_account_credentials"."account_id"))::integer AS "count"
           FROM "public"."send_account_credentials") AS "passkeys",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "public"."tags"
          WHERE ("tags"."status" = 'confirmed'::"public"."tag_status")) AS "sendtags",
    ( SELECT ("count"(DISTINCT "account_mapping"."from_profile_id"))::integer AS "count"
           FROM "account_mapping"
          WHERE ("account_mapping"."from_profile_id" IS NOT NULL)) AS "daily_active_senders",
    ( SELECT ("count"(DISTINCT "account_mapping"."to_profile_id"))::integer AS "count"
           FROM "account_mapping"
          WHERE ("account_mapping"."to_profile_id" IS NOT NULL)) AS "daily_active_receivers",
    ( SELECT ("count"(DISTINCT COALESCE("am"."from_profile_id", "am"."to_profile_id")))::integer AS "count"
           FROM "account_mapping" "am") AS "daily_active_transfers",
    ( SELECT ("count"(*))::integer AS "count"
           FROM "daily_transfers") AS "total_transactions",
    ( SELECT COALESCE("sum"(
                CASE
                    WHEN ("daily_transfers"."log_addr" = "decode"('833589fcd6edb6e08f4c7c32d4f71b54bda02913'::"text", 'hex'::"text")) THEN (COALESCE("daily_transfers"."v", (0)::numeric) / 1000000.0)
                    ELSE (0)::numeric
                END), (0)::numeric) AS "coalesce"
           FROM "daily_transfers") AS "usdc_volume",
    ( SELECT COALESCE("sum"(
                CASE
                    WHEN ("daily_transfers"."log_addr" = ANY (ARRAY["decode"('3f14920c99beb920afa163031c4e47a3e03b3e4a'::"text", 'hex'::"text"), "decode"('Eab49138BA2Ea6dd776220fE26b7b8E446638956'::"text", 'hex'::"text")])) THEN (COALESCE("daily_transfers"."v", (0)::numeric) / 1000000000000000000.0)
                    ELSE (0)::numeric
                END), (0)::numeric) AS "coalesce"
           FROM "daily_transfers") AS "send_volume",
    ( SELECT (COALESCE(("sum"("sendtag_checkout_receipts"."amount") / 1000000.0), (0)::numeric) - COALESCE(("sum"("sendtag_checkout_receipts"."reward") / 1000000.0), (0)::numeric))
           FROM "public"."sendtag_checkout_receipts") AS "sendtag_revenue",
    ( SELECT COALESCE(("sum"("sendtag_checkout_receipts"."reward") / 1000000.0), (0)::numeric) AS "coalesce"
           FROM "public"."sendtag_checkout_receipts") AS "sendtag_referral_payouts",
    ( SELECT "json_agg"("row_to_json"("t".*)) AS "json_agg"
           FROM ( SELECT "tags"."name"
                   FROM "public"."tags"
                  WHERE ("tags"."status" = 'confirmed'::"public"."tag_status")
                  ORDER BY "tags"."created_at" DESC
                 LIMIT 10) "t") AS "new_sendtags",
    ( SELECT "json_agg"("row_to_json"("t".*)) AS "json_agg"
           FROM ( WITH "new_affiliates" AS (
                         SELECT "a"."user_id",
                            "a"."created_at" AS "affiliate_created_at",
                            "count"("r"."referred_id") AS "referral_count"
                           FROM ("public"."affiliate_stats" "a"
                             LEFT JOIN "public"."referrals" "r" ON (("r"."referrer_id" = "a"."user_id")))
                          GROUP BY "a"."user_id", "a"."created_at"
                         HAVING ("count"("r"."referred_id") > 0)
                        ), "recent_transfers" AS (
                         SELECT ("concat"('0x', "encode"("st"."t", 'hex'::"text")))::"public"."citext" AS "receiver_address",
                            "st"."v" AS "amount",
                            "st"."block_time"
                           FROM "public"."send_token_transfers" "st"
                          WHERE ("st"."block_time" >= EXTRACT(epoch FROM ("now"() - '30 days'::interval)))
                        )
                 SELECT "t_1"."name"
                   FROM ((("new_affiliates" "na"
                     JOIN "public"."send_accounts" "sa" ON (("sa"."user_id" = "na"."user_id")))
                     LEFT JOIN "recent_transfers" "rt" ON (("rt"."receiver_address" OPERATOR("public".=) "sa"."address")))
                     JOIN "public"."tags" "t_1" ON ((("t_1"."user_id" = "na"."user_id") AND ("t_1"."status" = 'confirmed'::"public"."tag_status"))))
                  GROUP BY "na"."user_id", "na"."affiliate_created_at", "na"."referral_count", "t_1"."name"
                 HAVING (COALESCE("sum"("rt"."amount"), (0)::numeric) > (0)::numeric)
                  ORDER BY "na"."affiliate_created_at" DESC
                 LIMIT 10) "t") AS "new_affiliates",
    ( SELECT "json_agg"("row_to_json"("tai".*)) AS "json_agg"
           FROM "top_all_ips" "tai") AS "top_all_ips";


ALTER TABLE "public"."dashboard_metrics" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distribution_shares_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distribution_shares_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distribution_shares_id_seq" OWNED BY "public"."distribution_shares"."id";



CREATE TABLE IF NOT EXISTS "public"."distribution_verification_values" (
    "type" "public"."verification_type" NOT NULL,
    "fixed_value" numeric NOT NULL,
    "bips_value" bigint NOT NULL,
    "distribution_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "multiplier_min" numeric(10,4) DEFAULT 1.0 NOT NULL,
    "multiplier_max" numeric(10,4) DEFAULT 1.0 NOT NULL,
    "multiplier_step" numeric(10,4) DEFAULT 0.0 NOT NULL
);


ALTER TABLE "public"."distribution_verification_values" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."distribution_verifications" (
    "id" integer NOT NULL,
    "distribution_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."verification_type" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "weight" numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."distribution_verifications" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distribution_verifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distribution_verifications_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distribution_verifications_id_seq" OWNED BY "public"."distribution_verifications"."id";



CREATE TABLE IF NOT EXISTS "public"."distributions" (
    "id" integer NOT NULL,
    "number" integer NOT NULL,
    "amount" numeric NOT NULL,
    "hodler_pool_bips" bigint NOT NULL,
    "bonus_pool_bips" bigint NOT NULL,
    "fixed_pool_bips" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "qualification_start" timestamp with time zone NOT NULL,
    "qualification_end" timestamp with time zone NOT NULL,
    "claim_end" timestamp with time zone NOT NULL,
    "hodler_min_balance" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "snapshot_block_num" bigint,
    "chain_id" integer NOT NULL,
    "merkle_drop_addr" "bytea",
    "token_addr" "bytea",
    "token_decimals" numeric,
    "tranche_id" integer NOT NULL
);


ALTER TABLE "public"."distributions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."distributions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."distributions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."distributions_id_seq" OWNED BY "public"."distributions"."id";



CREATE TABLE IF NOT EXISTS "public"."liquidity_pools" (
    "pool_name" "text" NOT NULL,
    "pool_type" "text" NOT NULL,
    "pool_addr" "bytea" NOT NULL,
    "chain_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."liquidity_pools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "hash" "public"."citext",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid" NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" NOT NULL,
    CONSTRAINT "receipts_hash_check" CHECK ((("length"(("hash")::"text") = 66) AND ("hash" OPERATOR("public".~) '^0x[A-Fa-f0-9]{64}$'::"public"."citext")))
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."receipts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."receipts_id_seq" OWNED BY "public"."receipts"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."referrals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."referrals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."referrals_id_seq" OWNED BY "public"."referrals"."id";



CREATE OR REPLACE VIEW "public"."referrer" WITH ("security_barrier"='on') AS
 WITH "referrer" AS (
         SELECT "p"."send_id"
           FROM ("public"."referrals" "r"
             JOIN "public"."profiles" "p" ON (("r"."referrer_id" = "p"."id")))
          WHERE ("r"."referred_id" = ( SELECT "auth"."uid"() AS "uid"))
          ORDER BY "r"."created_at"
         LIMIT 1
        ), "profile_lookup" AS (
         SELECT "p"."id",
            "p"."avatar_url",
            "p"."name",
            "p"."about",
            "p"."refcode",
            "p"."x_username",
            "p"."birthday",
            "p"."tag",
            "p"."address",
            "p"."chain_id",
            "p"."is_public",
            "p"."sendid",
            "p"."all_tags",
            "referrer"."send_id"
           FROM ("public"."profile_lookup"('sendid'::"public"."lookup_type_enum", ( SELECT ("referrer_1"."send_id")::"text" AS "send_id"
                   FROM "referrer" "referrer_1")) "p"("id", "avatar_url", "name", "about", "refcode", "x_username", "birthday", "tag", "address", "chain_id", "is_public", "sendid", "all_tags")
             JOIN "referrer" ON (("referrer"."send_id" IS NOT NULL)))
        )
 SELECT "profile_lookup"."id",
    "profile_lookup"."avatar_url",
    "profile_lookup"."name",
    "profile_lookup"."about",
    "profile_lookup"."refcode",
    "profile_lookup"."x_username",
    "profile_lookup"."birthday",
    "profile_lookup"."tag",
    "profile_lookup"."address",
    "profile_lookup"."chain_id",
    "profile_lookup"."is_public",
    "profile_lookup"."sendid",
    "profile_lookup"."all_tags",
    "profile_lookup"."send_id"
   FROM "profile_lookup";


ALTER TABLE "public"."referrer" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_account_created" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "user_op_hash" "bytea",
    "tx_hash" "bytea" NOT NULL,
    "account" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_account_created" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_account_created_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_account_created_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_account_created_id_seq" OWNED BY "public"."send_account_created"."id";



CREATE TABLE IF NOT EXISTS "public"."send_account_receives" (
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL,
    "chain_id" numeric NOT NULL,
    "block_num" numeric NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "tx_idx" numeric NOT NULL,
    "log_idx" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "value" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "abi_idx" smallint NOT NULL
);


ALTER TABLE "public"."send_account_receives" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_account_receives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_account_receives_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_account_receives_id_seq" OWNED BY "public"."send_account_receives"."id";



CREATE TABLE IF NOT EXISTS "public"."send_account_signing_key_added" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "account" "bytea" NOT NULL,
    "key_slot" smallint NOT NULL,
    "key" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_account_signing_key_added" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_account_signing_key_added_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_account_signing_key_added_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_account_signing_key_added_id_seq" OWNED BY "public"."send_account_signing_key_added"."id";



CREATE TABLE IF NOT EXISTS "public"."send_account_signing_key_removed" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "account" "bytea" NOT NULL,
    "key_slot" smallint NOT NULL,
    "key" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_account_signing_key_removed" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_account_signing_key_removed_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_account_signing_key_removed_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_account_signing_key_removed_id_seq" OWNED BY "public"."send_account_signing_key_removed"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."send_account_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_account_transfers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_account_transfers_id_seq" OWNED BY "public"."send_account_transfers"."id";



CREATE TABLE IF NOT EXISTS "public"."send_earn_deposit" (
    "id" bigint NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "owner" "bytea" NOT NULL,
    "assets" numeric NOT NULL,
    "shares" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_earn_deposit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."send_earn_withdraw" (
    "id" bigint NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "receiver" "bytea" NOT NULL,
    "owner" "bytea" NOT NULL,
    "assets" numeric NOT NULL,
    "shares" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_earn_withdraw" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."send_earn_activity" WITH ("security_invoker"='on', "security_barrier"='on') AS
 SELECT 'deposit'::"text" AS "type",
    "d"."block_num",
    "d"."block_time",
    "d"."log_addr",
    "d"."owner",
    "d"."sender",
    "d"."assets",
    "d"."shares",
    "d"."tx_hash"
   FROM "public"."send_earn_deposit" "d"
UNION ALL
 SELECT 'withdraw'::"text" AS "type",
    "w"."block_num",
    "w"."block_time",
    "w"."log_addr",
    "w"."owner",
    "w"."sender",
    "w"."assets",
    "w"."shares",
    "w"."tx_hash"
   FROM "public"."send_earn_withdraw" "w"
  ORDER BY 3 DESC;


ALTER TABLE "public"."send_earn_activity" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."send_earn_balances" WITH ("security_invoker"='on', "security_barrier"='on') AS
 WITH "txs" AS (
         SELECT "send_earn_deposit"."log_addr",
            "send_earn_deposit"."owner",
            "send_earn_deposit"."assets",
            "send_earn_deposit"."shares"
           FROM "public"."send_earn_deposit"
        UNION
         SELECT "send_earn_withdraw"."log_addr",
            "send_earn_withdraw"."owner",
            ("send_earn_withdraw"."assets" * ('-1'::integer)::numeric),
            ("send_earn_withdraw"."shares" * ('-1'::integer)::numeric)
           FROM "public"."send_earn_withdraw"
        )
 SELECT "t"."log_addr",
    "t"."owner",
    "sum"("t"."assets") AS "assets",
    "sum"("t"."shares") AS "shares"
   FROM "txs" "t"
  GROUP BY "t"."log_addr", "t"."owner";


ALTER TABLE "public"."send_earn_balances" OWNER TO "postgres";


ALTER TABLE "public"."send_earn_create" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_create_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."send_earn_deposit" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_deposit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."send_earn_new_affiliate" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_new_affiliate_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."send_earn_withdraw" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_withdraw_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."send_liquidity_pools" (
    "id" integer NOT NULL,
    "address" "bytea" NOT NULL,
    "chain_id" integer NOT NULL
);


ALTER TABLE "public"."send_liquidity_pools" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_liquidity_pools_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_liquidity_pools_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_liquidity_pools_id_seq" OWNED BY "public"."send_liquidity_pools"."id";



CREATE TABLE IF NOT EXISTS "public"."send_revenues_safe_receives" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "sender" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_revenues_safe_receives" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_revenues_safe_receives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_revenues_safe_receives_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_revenues_safe_receives_id_seq" OWNED BY "public"."send_revenues_safe_receives"."id";



CREATE TABLE IF NOT EXISTS "public"."send_slash" (
    "distribution_number" integer NOT NULL,
    "minimum_sends" smallint DEFAULT '1'::smallint NOT NULL,
    "scaling_divisor" smallint DEFAULT '1'::smallint NOT NULL,
    "distribution_id" integer NOT NULL
);


ALTER TABLE "public"."send_slash" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_token_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_token_transfers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_token_transfers_id_seq" OWNED BY "public"."send_token_transfers"."id";



CREATE TABLE IF NOT EXISTS "public"."send_token_v0_transfers" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "f" "bytea" NOT NULL,
    "t" "bytea" NOT NULL,
    "v" numeric NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);


ALTER TABLE "public"."send_token_v0_transfers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."send_token_v0_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."send_token_v0_transfers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."send_token_v0_transfers_id_seq" OWNED BY "public"."send_token_v0_transfers"."id";



CREATE TABLE IF NOT EXISTS "public"."sendpot_jackpot_runs" (
    "id" integer NOT NULL,
    "chain_id" numeric,
    "log_addr" "bytea",
    "block_time" numeric,
    "tx_hash" "bytea",
    "time" numeric,
    "winner" "bytea",
    "winning_ticket" numeric,
    "win_amount" numeric,
    "tickets_purchased_total_bps" numeric,
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);


ALTER TABLE "public"."sendpot_jackpot_runs" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sendpot_jackpot_runs_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sendpot_jackpot_runs_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sendpot_jackpot_runs_id_seq" OWNED BY "public"."sendpot_jackpot_runs"."id";



CREATE TABLE IF NOT EXISTS "public"."sendpot_user_ticket_purchases" (
    "id" integer NOT NULL,
    "chain_id" numeric,
    "log_addr" "bytea",
    "block_time" numeric,
    "tx_hash" "bytea",
    "referrer" "bytea",
    "value" numeric,
    "recipient" "bytea",
    "buyer" "bytea",
    "tickets_purchased_total_bps" numeric,
    "ig_name" "text",
    "src_name" "text",
    "block_num" numeric,
    "tx_idx" integer,
    "log_idx" integer,
    "abi_idx" smallint
);


ALTER TABLE "public"."sendpot_user_ticket_purchases" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."sendpot_user_ticket_purchases_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sendpot_user_ticket_purchases_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" OWNED BY "public"."sendpot_user_ticket_purchases"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."sendtag_checkout_receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."sendtag_checkout_receipts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sendtag_checkout_receipts_id_seq" OWNED BY "public"."sendtag_checkout_receipts"."id";



CREATE TABLE IF NOT EXISTS "public"."swap_routers" (
    "router_addr" "bytea" NOT NULL,
    "chain_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."swap_routers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tag_receipts" (
    "tag_name" "public"."citext" NOT NULL,
    "hash" "public"."citext",
    "event_id" "text",
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tag_receipts" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tag_receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."tag_receipts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tag_receipts_id_seq" OWNED BY "public"."tag_receipts"."id";



CREATE TABLE IF NOT EXISTS "public"."workflow_ids" (
    "array_agg" "text"[]
);


ALTER TABLE "public"."workflow_ids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "shovel"."ig_updates" (
    "name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "backfill" boolean DEFAULT false,
    "num" numeric NOT NULL,
    "latency" interval,
    "nrows" numeric,
    "stop" numeric
);


ALTER TABLE "shovel"."ig_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "shovel"."integrations" (
    "name" "text",
    "conf" "jsonb"
);


ALTER TABLE "shovel"."integrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "shovel"."task_updates" (
    "num" numeric,
    "hash" "bytea",
    "insert_at" timestamp with time zone DEFAULT "now"(),
    "src_hash" "bytea",
    "src_num" numeric,
    "nblocks" numeric,
    "nrows" numeric,
    "latency" interval,
    "src_name" "text",
    "stop" numeric,
    "chain_id" integer,
    "ig_name" "text"
);


ALTER TABLE "shovel"."task_updates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "shovel"."latest" AS
 WITH "abs_latest" AS (
         SELECT "task_updates"."src_name",
            "max"("task_updates"."num") AS "num"
           FROM "shovel"."task_updates"
          GROUP BY "task_updates"."src_name"
        ), "src_latest" AS (
         SELECT "task_updates"."src_name",
            "max"("task_updates"."num") AS "num"
           FROM "shovel"."task_updates",
            "abs_latest"
          WHERE (("task_updates"."src_name" = "abs_latest"."src_name") AND (("abs_latest"."num" - "task_updates"."num") <= (10)::numeric))
          GROUP BY "task_updates"."src_name", "task_updates"."ig_name"
        )
 SELECT "src_latest"."src_name",
    "min"("src_latest"."num") AS "num"
   FROM "src_latest"
  GROUP BY "src_latest"."src_name";


ALTER TABLE "shovel"."latest" OWNER TO "postgres";


CREATE OR REPLACE VIEW "shovel"."source_updates" AS
 SELECT DISTINCT ON ("task_updates"."src_name") "task_updates"."src_name",
    "task_updates"."num",
    "task_updates"."hash",
    "task_updates"."src_num",
    "task_updates"."src_hash",
    "task_updates"."nblocks",
    "task_updates"."nrows",
    "task_updates"."latency"
   FROM "shovel"."task_updates"
  ORDER BY "task_updates"."src_name", "task_updates"."num" DESC;


ALTER TABLE "shovel"."source_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "shovel"."sources" (
    "name" "text",
    "chain_id" integer,
    "url" "text"
);


ALTER TABLE "shovel"."sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "temporal"."send_account_transfers" (
    "id" integer NOT NULL,
    "workflow_id" "text" NOT NULL,
    "status" "temporal"."transfer_status" DEFAULT 'initialized'::"temporal"."transfer_status" NOT NULL,
    "user_id" "uuid",
    "created_at_block_num" numeric,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "send_account_transfers_activity_event_id" "text",
    "send_account_transfers_activity_event_name" "text"
);


ALTER TABLE "temporal"."send_account_transfers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "temporal"."send_account_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "temporal"."send_account_transfers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "temporal"."send_account_transfers_id_seq" OWNED BY "temporal"."send_account_transfers"."id";



CREATE TABLE IF NOT EXISTS "temporal"."send_earn_deposits" (
    "workflow_id" "text" NOT NULL,
    "status" "public"."temporal_status" DEFAULT 'initialized'::"public"."temporal_status" NOT NULL,
    "owner" "bytea",
    "assets" numeric,
    "vault" "bytea",
    "user_op_hash" "bytea",
    "block_num" numeric,
    "activity_id" bigint,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "temporal"."send_earn_deposits" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activity_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."challenges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."challenges_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distribution_shares" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distribution_shares_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distribution_verifications" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distribution_verifications_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."distributions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."distributions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."receipts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."referrals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."referrals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_account_created" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_created_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_account_receives" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_receives_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_account_signing_key_added" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_signing_key_added_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_account_signing_key_removed" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_signing_key_removed_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_account_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_transfers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_liquidity_pools" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_liquidity_pools_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_revenues_safe_receives" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_revenues_safe_receives_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_token_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_token_transfers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."send_token_v0_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_token_v0_transfers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sendpot_jackpot_runs" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendpot_jackpot_runs_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sendpot_user_ticket_purchases" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendpot_user_ticket_purchases_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sendtag_checkout_receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sendtag_checkout_receipts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tag_receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tag_receipts_id_seq"'::"regclass");



ALTER TABLE ONLY "temporal"."send_account_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"temporal"."send_account_transfers_id_seq"'::"regclass");



ALTER TABLE ONLY "private"."leaderboard_referrals_all_time"
    ADD CONSTRAINT "leaderboard_referrals_all_time_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_pkey" PRIMARY KEY ("account_id", "credential_id");



ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."chain_addresses"
    ADD CONSTRAINT "chain_addresses_pkey" PRIMARY KEY ("address");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_challenge_key" UNIQUE ("challenge");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distribution_verification_values"
    ADD CONSTRAINT "distribution_verification_values_pkey" PRIMARY KEY ("type", "distribution_id");



ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distributions"
    ADD CONSTRAINT "distributions_tranche_id_key" UNIQUE ("merkle_drop_addr", "tranche_id");



ALTER TABLE ONLY "public"."liquidity_pools"
    ADD CONSTRAINT "liquidity_pools_pkey" PRIMARY KEY ("pool_addr", "chain_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_account_created"
    ADD CONSTRAINT "send_account_created_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_account_receives"
    ADD CONSTRAINT "send_account_receives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_account_signing_key_added"
    ADD CONSTRAINT "send_account_signing_key_added_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_account_signing_key_removed"
    ADD CONSTRAINT "send_account_signing_key_removed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_account_transfers"
    ADD CONSTRAINT "send_account_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_accounts"
    ADD CONSTRAINT "send_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_liquidity_pools"
    ADD CONSTRAINT "send_liquidity_pools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_revenues_safe_receives"
    ADD CONSTRAINT "send_revenues_safe_receives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_pkey" PRIMARY KEY ("distribution_number");



ALTER TABLE ONLY "public"."send_token_transfers"
    ADD CONSTRAINT "send_token_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."send_token_v0_transfers"
    ADD CONSTRAINT "send_token_v0_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sendpot_jackpot_runs"
    ADD CONSTRAINT "sendpot_jackpot_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sendpot_user_ticket_purchases"
    ADD CONSTRAINT "sendpot_user_ticket_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sendtag_checkout_receipts"
    ADD CONSTRAINT "sendtag_checkout_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."swap_routers"
    ADD CONSTRAINT "swap_routers_pkey" PRIMARY KEY ("router_addr", "chain_id");



ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "unique_referred_id" UNIQUE ("referred_id");



ALTER TABLE ONLY "public"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "temporal"."send_account_transfers"
    ADD CONSTRAINT "send_account_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "temporal"."send_earn_deposits"
    ADD CONSTRAINT "send_earn_deposits_pkey" PRIMARY KEY ("workflow_id");



CREATE INDEX "leaderboard_referrals_all_time_referral_count_idx" ON "private"."leaderboard_referrals_all_time" USING "btree" ("referrals" DESC);



CREATE INDEX "leaderboard_referrals_all_time_total_reward_idx" ON "private"."leaderboard_referrals_all_time" USING "btree" ("rewards_usdc" DESC);



CREATE INDEX "activity_created_at_idx" ON "public"."activity" USING "btree" ("created_at");



CREATE UNIQUE INDEX "activity_event_name_event_id_idx" ON "public"."activity" USING "btree" ("event_name", "event_id");



CREATE INDEX "activity_from_user_id_event_name_idx" ON "public"."activity" USING "btree" ("from_user_id", "created_at", "event_name");



CREATE INDEX "activity_to_user_id_event_name_idx" ON "public"."activity" USING "btree" ("to_user_id", "created_at", "event_name");



CREATE INDEX "chain_addresses_user_id_idx" ON "public"."chain_addresses" USING "btree" ("user_id");



CREATE UNIQUE INDEX "distribution_shares_address_idx" ON "public"."distribution_shares" USING "btree" ("address", "distribution_id");



CREATE INDEX "distribution_shares_distribution_id_idx" ON "public"."distribution_shares" USING "btree" ("distribution_id");



CREATE UNIQUE INDEX "distribution_shares_distribution_id_index_uindex" ON "public"."distribution_shares" USING "btree" ("distribution_id", "index");



CREATE UNIQUE INDEX "distribution_shares_user_id_idx" ON "public"."distribution_shares" USING "btree" ("user_id", "distribution_id");



CREATE INDEX "distribution_verifications_distribution_id_index" ON "public"."distribution_verifications" USING "btree" ("distribution_id");



CREATE INDEX "distribution_verifications_user_id_index" ON "public"."distribution_verifications" USING "btree" ("user_id");



CREATE INDEX "i_send_account_receives_log_addr" ON "public"."send_account_receives" USING "btree" ("log_addr");



CREATE INDEX "i_send_account_receives_sender" ON "public"."send_account_receives" USING "btree" ("sender");



CREATE INDEX "idx_affiliate_stats_user_created" ON "public"."affiliate_stats" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_distribution_verifications_composite" ON "public"."distribution_verifications" USING "btree" ("distribution_id", "user_id", "type");



CREATE INDEX "idx_distributions_qualification_dates" ON "public"."distributions" USING "btree" ("qualification_start", "qualification_end");



CREATE INDEX "idx_send_account_transfers_f_t_block_time" ON "public"."send_account_transfers" USING "btree" ("f", "t", "block_time");



CREATE INDEX "idx_send_accounts_address" ON "public"."send_accounts" USING "btree" ("address");



CREATE INDEX "idx_send_accounts_address_user" ON "public"."send_accounts" USING "btree" ("address", "user_id");



CREATE INDEX "idx_sendpot_jackpot_runs_block_num" ON "public"."sendpot_jackpot_runs" USING "btree" ("block_num");



CREATE INDEX "idx_sendpot_user_ticket_purchases_block_num" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("block_num");



CREATE INDEX "idx_sendtag_receipts" ON "public"."sendtag_checkout_receipts" USING "btree" ("amount", "reward");



CREATE INDEX "idx_tags_status_created" ON "public"."tags" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'confirmed'::"public"."tag_status");



CREATE INDEX "profiles_send_id_idx" ON "public"."profiles" USING "btree" ("send_id");



CREATE UNIQUE INDEX "receipts_event_id_idx" ON "public"."receipts" USING "btree" ("event_id");



CREATE INDEX "receipts_user_id_idx" ON "public"."receipts" USING "btree" ("user_id");



CREATE INDEX "send_account_created_account_block_num" ON "public"."send_account_created" USING "btree" ("block_num");



CREATE INDEX "send_account_created_account_block_time" ON "public"."send_account_created" USING "btree" ("block_time");



CREATE UNIQUE INDEX "send_account_credentials_account_id_key_slot_key" ON "public"."send_account_credentials" USING "btree" ("account_id", "key_slot");



CREATE INDEX "send_account_receives_block_num" ON "public"."send_account_receives" USING "btree" ("block_num");



CREATE INDEX "send_account_receives_block_time" ON "public"."send_account_receives" USING "btree" ("block_time");



CREATE INDEX "send_account_signing_key_added_account_idx" ON "public"."send_account_signing_key_added" USING "btree" ("account");



CREATE INDEX "send_account_signing_key_added_block_num" ON "public"."send_account_signing_key_added" USING "btree" ("block_num");



CREATE INDEX "send_account_signing_key_added_block_time" ON "public"."send_account_signing_key_added" USING "btree" ("block_time");



CREATE INDEX "send_account_signing_key_removed_block_num" ON "public"."send_account_signing_key_removed" USING "btree" ("block_num");



CREATE INDEX "send_account_signing_key_removed_block_time" ON "public"."send_account_signing_key_removed" USING "btree" ("block_time");



CREATE INDEX "send_account_transfers_block_num" ON "public"."send_account_transfers" USING "btree" ("block_num");



CREATE INDEX "send_account_transfers_block_time" ON "public"."send_account_transfers" USING "btree" ("block_time");



CREATE INDEX "send_account_transfers_f" ON "public"."send_account_transfers" USING "btree" ("f");



CREATE INDEX "send_account_transfers_t" ON "public"."send_account_transfers" USING "btree" ("t");



CREATE UNIQUE INDEX "send_accounts_address_key" ON "public"."send_accounts" USING "btree" ("address", "chain_id");



CREATE INDEX "send_accounts_user_id_index" ON "public"."send_accounts" USING "btree" ("user_id");



CREATE INDEX "send_earn_create_block_num" ON "public"."send_earn_create" USING "btree" ("block_num");



CREATE INDEX "send_earn_create_block_time" ON "public"."send_earn_create" USING "btree" ("block_time");



CREATE INDEX "send_earn_create_send_earn" ON "public"."send_earn_create" USING "btree" ("send_earn");



CREATE INDEX "send_earn_deposit_block_num" ON "public"."send_earn_deposit" USING "btree" ("block_num");



CREATE INDEX "send_earn_deposit_block_time" ON "public"."send_earn_deposit" USING "btree" ("block_time");



CREATE INDEX "send_earn_deposit_owner_idx" ON "public"."send_earn_deposit" USING "btree" ("owner", "log_addr");



CREATE INDEX "send_earn_new_affiliate_affiliate_idx" ON "public"."send_earn_new_affiliate" USING "btree" ("affiliate");



CREATE INDEX "send_earn_new_affiliate_block_num" ON "public"."send_earn_new_affiliate" USING "btree" ("block_num");



CREATE INDEX "send_earn_new_affiliate_block_time" ON "public"."send_earn_new_affiliate" USING "btree" ("block_time");



CREATE INDEX "send_earn_new_affiliate_send_earn_affiliate_idx" ON "public"."send_earn_new_affiliate" USING "btree" ("send_earn_affiliate");



CREATE INDEX "send_earn_withdraw_block_num" ON "public"."send_earn_withdraw" USING "btree" ("block_num");



CREATE INDEX "send_earn_withdraw_block_time" ON "public"."send_earn_withdraw" USING "btree" ("block_time");



CREATE INDEX "send_earn_withdraw_owner_idx" ON "public"."send_earn_withdraw" USING "btree" ("owner", "log_addr");



CREATE INDEX "send_revenues_safe_receives_block_num" ON "public"."send_revenues_safe_receives" USING "btree" ("block_num");



CREATE INDEX "send_revenues_safe_receives_block_time" ON "public"."send_revenues_safe_receives" USING "btree" ("block_time");



CREATE INDEX "send_revenues_safe_receives_sender" ON "public"."send_revenues_safe_receives" USING "btree" ("sender");



CREATE INDEX "send_revenues_safe_receives_tx_hash" ON "public"."send_revenues_safe_receives" USING "btree" ("tx_hash");



CREATE INDEX "send_token_transfers_block_num" ON "public"."send_token_transfers" USING "btree" ("block_num");



CREATE INDEX "send_token_transfers_block_time" ON "public"."send_token_transfers" USING "btree" ("block_time");



CREATE INDEX "send_token_transfers_composite" ON "public"."send_token_transfers" USING "btree" ("block_time", "f", "t", "v");



CREATE INDEX "send_token_transfers_f" ON "public"."send_token_transfers" USING "btree" ("f");



CREATE INDEX "send_token_transfers_t" ON "public"."send_token_transfers" USING "btree" ("t");



CREATE INDEX "send_token_v0_transfers_block_num" ON "public"."send_token_v0_transfers" USING "btree" ("block_num");



CREATE INDEX "send_token_v0_transfers_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("block_time");



CREATE INDEX "send_token_v0_transfers_composite" ON "public"."send_token_v0_transfers" USING "btree" ("block_time", "f", "t", "v");



CREATE INDEX "send_token_v0_transfers_f" ON "public"."send_token_v0_transfers" USING "btree" ("f");



CREATE INDEX "send_token_v0_transfers_t" ON "public"."send_token_v0_transfers" USING "btree" ("t");



CREATE INDEX "sendpot_jackpot_runs_winner" ON "public"."sendpot_jackpot_runs" USING "btree" ("winner");



CREATE INDEX "sendpot_user_ticket_purchases_buyer" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("buyer");



CREATE INDEX "sendpot_user_ticket_purchases_recipient" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("recipient");



CREATE INDEX "sendpot_user_ticket_purchases_referrer" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("referrer");



CREATE INDEX "sendtag_checkout_receipts_block_num" ON "public"."sendtag_checkout_receipts" USING "btree" ("block_num");



CREATE INDEX "sendtag_checkout_receipts_block_time" ON "public"."sendtag_checkout_receipts" USING "btree" ("block_time");



CREATE INDEX "sendtag_checkout_receipts_sender_idx" ON "public"."sendtag_checkout_receipts" USING "btree" ("sender");



CREATE INDEX "shovel_account" ON "public"."send_account_created" USING "btree" ("account");



CREATE UNIQUE INDEX "tag_receipts_event_id_idx" ON "public"."tag_receipts" USING "btree" ("tag_name", "event_id");



CREATE INDEX "tags_name_trigram_gin_idx" ON "public"."tags" USING "gin" ("name" "extensions"."gin_trgm_ops");



CREATE INDEX "tags_user_id_idx" ON "public"."tags" USING "btree" ("user_id");



CREATE UNIQUE INDEX "u_send_account_created" ON "public"."send_account_created" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx");



CREATE UNIQUE INDEX "u_send_account_receives" ON "public"."send_account_receives" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_account_signing_key_added" ON "public"."send_account_signing_key_added" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_account_signing_key_removed" ON "public"."send_account_signing_key_removed" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_account_transfers" ON "public"."send_account_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_earn_create" ON "public"."send_earn_create" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_earn_deposit" ON "public"."send_earn_deposit" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_earn_new_affiliate" ON "public"."send_earn_new_affiliate" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_earn_withdraw" ON "public"."send_earn_withdraw" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_revenues_safe_receives" ON "public"."send_revenues_safe_receives" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_token_transfers" ON "public"."send_token_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_send_token_v0_transfers" ON "public"."send_token_v0_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_sendpot_jackpot_runs" ON "public"."sendpot_jackpot_runs" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_sendpot_user_ticket_purchases" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "u_sendtag_checkout_receipts" ON "public"."sendtag_checkout_receipts" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");



CREATE UNIQUE INDEX "webauthn_credentials_public_key" ON "public"."webauthn_credentials" USING "btree" ("public_key");



CREATE UNIQUE INDEX "webauthn_credentials_raw_credential_id" ON "public"."webauthn_credentials" USING "btree" ("raw_credential_id", "user_id");



CREATE UNIQUE INDEX "intg_name_src_name_backfill_num_idx" ON "shovel"."ig_updates" USING "btree" ("name", "src_name", "backfill", "num" DESC);



CREATE UNIQUE INDEX "sources_name_chain_id_idx" ON "shovel"."sources" USING "btree" ("name", "chain_id");



CREATE UNIQUE INDEX "sources_name_idx" ON "shovel"."sources" USING "btree" ("name");



CREATE UNIQUE INDEX "task_src_name_num_idx" ON "shovel"."task_updates" USING "btree" ("ig_name", "src_name", "num" DESC);



CREATE INDEX "idx_temporal_send_earn_deposits_activity_id" ON "temporal"."send_earn_deposits" USING "btree" ("activity_id");



CREATE INDEX "idx_temporal_send_earn_deposits_created_at" ON "temporal"."send_earn_deposits" USING "btree" ("created_at");



CREATE INDEX "idx_temporal_send_earn_deposits_status_owner_block_num" ON "temporal"."send_earn_deposits" USING "btree" ("status", "owner", "block_num");



CREATE INDEX "send_account_transfers_status_created_at_block_num_idx" ON "temporal"."send_account_transfers" USING "btree" ("status", "created_at_block_num" DESC);



CREATE INDEX "send_account_transfers_user_id_workflow_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("user_id", "workflow_id");



CREATE INDEX "send_account_transfers_workflow_id_created_at_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id", "created_at" DESC);



CREATE INDEX "send_account_transfers_workflow_id_updated_at_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id", "updated_at" DESC);



CREATE INDEX "temporal_send_account_transfers_activity_event_name_event_id_id" ON "temporal"."send_account_transfers" USING "btree" ("send_account_transfers_activity_event_id", "send_account_transfers_activity_event_name");



CREATE INDEX "temporal_send_account_transfers_user_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("user_id");



CREATE UNIQUE INDEX "temporal_send_account_transfers_workflow_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id");



CREATE OR REPLACE TRIGGER "aaa_filter_send_earn_deposit_with_no_send_account_created" BEFORE INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"();



CREATE OR REPLACE TRIGGER "aaa_filter_send_earn_withdraw_with_no_send_account_created" BEFORE INSERT ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"();



CREATE OR REPLACE TRIGGER "aaa_send_earn_deposit_trigger_delete_activity" AFTER DELETE ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_deposit_trigger_delete_activity"();



CREATE OR REPLACE TRIGGER "aaa_send_earn_withdraw_trigger_delete_activity" AFTER DELETE ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_withdraw_trigger_delete_activity"();



CREATE OR REPLACE TRIGGER "aab_send_earn_deposit_trigger_insert_activity" AFTER INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_deposit_trigger_insert_activity"();



CREATE OR REPLACE TRIGGER "aab_send_earn_withdraw_trigger_insert_activity" AFTER INSERT ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_withdraw_trigger_insert_activity"();



CREATE OR REPLACE TRIGGER "aac_insert_referral_on_deposit" AFTER INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_deposit"();



CREATE OR REPLACE TRIGGER "after_transfer_update_affiliate_stats" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."update_affiliate_stats_on_transfer"();



CREATE OR REPLACE TRIGGER "avoid_send_id_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."stop_change_send_id"();



CREATE OR REPLACE TRIGGER "filter_send_account_transfers_with_no_send_account_created" BEFORE INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"();



CREATE OR REPLACE TRIGGER "insert_referral_on_create" AFTER INSERT ON "public"."send_earn_create" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_create"();



CREATE OR REPLACE TRIGGER "insert_referral_on_new_affiliate" AFTER INSERT ON "public"."send_earn_new_affiliate" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_new_affiliate"();



CREATE OR REPLACE TRIGGER "insert_verification_create_passkey" AFTER INSERT ON "public"."send_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_create_passkey"();



CREATE OR REPLACE TRIGGER "insert_verification_referral" AFTER INSERT ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_referral"();



CREATE OR REPLACE TRIGGER "insert_verification_send_ceiling_trigger" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_send_ceiling"();



CREATE OR REPLACE TRIGGER "insert_verification_sends" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();



CREATE OR REPLACE TRIGGER "insert_verification_tag_registration" AFTER INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_tag_registration"();



CREATE OR REPLACE TRIGGER "referrals_delete_activity_trigger" AFTER DELETE ON "public"."referrals" REFERENCING OLD TABLE AS "old_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."referrals_delete_activity_trigger"();



CREATE OR REPLACE TRIGGER "referrals_insert_activity_trigger" AFTER INSERT ON "public"."referrals" REFERENCING NEW TABLE AS "new_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."referrals_insert_activity_trigger"();



CREATE OR REPLACE TRIGGER "send_account_receives_delete_activity_trigger" AFTER DELETE ON "public"."send_account_receives" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_receives_delete_activity_trigger"();



CREATE OR REPLACE TRIGGER "send_account_receives_insert_activity_trigger" AFTER INSERT ON "public"."send_account_receives" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_receives_insert_activity_trigger"();



CREATE OR REPLACE TRIGGER "send_account_signing_key_added_trigger_delete_activity" AFTER DELETE ON "public"."send_account_signing_key_added" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"();



CREATE OR REPLACE TRIGGER "send_account_signing_key_added_trigger_insert_activity" AFTER INSERT ON "public"."send_account_signing_key_added" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"();



CREATE OR REPLACE TRIGGER "send_account_signing_key_removed_trigger_delete_activity" AFTER DELETE ON "public"."send_account_signing_key_removed" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"();



CREATE OR REPLACE TRIGGER "send_account_signing_key_removed_trigger_insert_activity" AFTER INSERT ON "public"."send_account_signing_key_removed" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"();



CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_activity" AFTER DELETE ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_delete_activity"();



CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_temporal_activity" BEFORE INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_delete_temporal_activity"();



CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_insert_activity" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_insert_activity"();



CREATE OR REPLACE TRIGGER "tag_receipts_insert_activity_trigger" AFTER INSERT ON "public"."tag_receipts" REFERENCING NEW TABLE AS "new_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."tag_receipts_insert_activity_trigger"();



CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_update_transfer_activit" BEFORE INSERT ON "public"."activity" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_activity_before_insert"();



CREATE OR REPLACE TRIGGER "trigger_chain_addresses_after_insert" AFTER INSERT OR UPDATE ON "public"."chain_addresses" FOR EACH ROW EXECUTE FUNCTION "public"."chain_addresses_after_insert"();



CREATE OR REPLACE TRIGGER "trigger_send_accounts_after_insert" AFTER INSERT OR UPDATE ON "public"."send_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."send_accounts_after_insert"();



CREATE OR REPLACE TRIGGER "trigger_tags_after_insert_or_update" AFTER INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_after_insert_or_update_func"();



CREATE OR REPLACE TRIGGER "trigger_tags_before_insert_or_update" BEFORE INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_before_insert_or_update_func"();



CREATE OR REPLACE TRIGGER "update_leaderboard_referrals_all_time_referrals" AFTER INSERT ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"();



CREATE OR REPLACE TRIGGER "update_leaderboard_referrals_all_time_sendtag_checkout_receipts" AFTER INSERT ON "public"."sendtag_checkout_receipts" FOR EACH ROW EXECUTE FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"();



CREATE OR REPLACE TRIGGER "aaa_temporal_deposit_insert_pending_activity" AFTER INSERT ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_deposit_insert_pending_activity"();



CREATE OR REPLACE TRIGGER "aab_temporal_deposit_update_activity_on_status_change" AFTER UPDATE ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"();



CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_add_note_activity_temporal_trans" BEFORE UPDATE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"();



CREATE OR REPLACE TRIGGER "set_temporal_send_earn_deposits_updated_at" BEFORE UPDATE ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();



CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_after_upsert" AFTER INSERT OR UPDATE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_transfer_after_upsert"();



CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_before_insert" BEFORE INSERT ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_transfer_before_insert"();



CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_delete_activity" BEFORE DELETE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"();



ALTER TABLE ONLY "private"."leaderboard_referrals_all_time"
    ADD CONSTRAINT "leaderboard_referrals_all_time_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."send_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."send_account_credentials"
    ADD CONSTRAINT "account_credentials_credential_id_fkey" FOREIGN KEY ("credential_id") REFERENCES "public"."webauthn_credentials"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."affiliate_stats"
    ADD CONSTRAINT "affiliate_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chain_addresses"
    ADD CONSTRAINT "chain_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distribution_shares"
    ADD CONSTRAINT "distribution_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distribution_verification_values"
    ADD CONSTRAINT "distribution_verification_values_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verification_values_fk" FOREIGN KEY ("type", "distribution_id") REFERENCES "public"."distribution_verification_values"("type", "distribution_id");



ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."distribution_verifications"
    ADD CONSTRAINT "distribution_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."send_accounts"
    ADD CONSTRAINT "send_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."send_slash"
    ADD CONSTRAINT "send_slash_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_tag_name_fkey" FOREIGN KEY ("tag_name") REFERENCES "public"."tags"("name") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "temporal"."send_earn_deposits"
    ADD CONSTRAINT "fk_activity" FOREIGN KEY ("activity_id") REFERENCES "public"."activity"("id") ON DELETE CASCADE;



CREATE POLICY "Addresses are viewable by users who created them." ON "public"."chain_addresses" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can see distribution_verification_values" ON "public"."distribution_verification_values" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "Enable read access for all users" ON "public"."send_slash" FOR SELECT USING (true);



CREATE POLICY "Enable read access to authenticated users" ON "public"."liquidity_pools" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access to authenticated users" ON "public"."swap_routers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access to public" ON "public"."distribution_verification_values" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access to public" ON "public"."distributions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Profiles are viewable by users who created them." ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Receipts are viewable by users." ON "public"."receipts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Send account signing key added can be read by the user who crea" ON "public"."send_account_signing_key_added" FOR SELECT USING (("account" IN ( SELECT "decode"("substring"(("send_accounts"."address")::"text", 3), 'hex'::"text") AS "decode"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Send revenues safe receives can be read by the user who created" ON "public"."send_revenues_safe_receives" FOR SELECT USING ((("lower"("concat"('0x', "encode"("sender", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "chain_addresses"."address"
   FROM "public"."chain_addresses"
  WHERE ("chain_addresses"."user_id" = ( SELECT "auth"."uid"() AS "uid"))
UNION
 SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "User can see own affiliate stats" ON "public"."affiliate_stats" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "User can see own shares" ON "public"."distribution_shares" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can see their own distribution verifications" ON "public"."distribution_verifications" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can see their own token transfers" ON "public"."send_token_transfers" FOR SELECT USING (("auth"."uid"() IN ( SELECT "chain_addresses"."user_id"
   FROM "public"."chain_addresses"
  WHERE (("chain_addresses"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("send_token_transfers"."f", 'hex'::"text"))))::"public"."citext") OR ("chain_addresses"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("send_token_transfers"."t", 'hex'::"text"))))::"public"."citext")))));



CREATE POLICY "Users can see their own token transfers" ON "public"."send_token_v0_transfers" FOR SELECT USING (("auth"."uid"() IN ( SELECT "chain_addresses"."user_id"
   FROM "public"."chain_addresses"
  WHERE (("chain_addresses"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("send_token_v0_transfers"."f", 'hex'::"text"))))::"public"."citext") OR ("chain_addresses"."address" OPERATOR("public".=) ("lower"("concat"('0x', "encode"("send_token_v0_transfers"."t", 'hex'::"text"))))::"public"."citext")))));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."affiliate_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated can read jackpot runs" ON "public"."sendpot_jackpot_runs" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."chain_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_account_credentials" ON "public"."send_account_credentials" FOR DELETE TO "authenticated" USING (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));



CREATE POLICY "delete_own_webauthn_credentials" ON "public"."webauthn_credentials" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "delete_policy" ON "public"."tags" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."tag_status")));



ALTER TABLE "public"."distribution_shares" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distribution_verification_values" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distribution_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."distributions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own_account_credentials" ON "public"."send_account_credentials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));



CREATE POLICY "insert_own_accounts" ON "public"."send_accounts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_own_credentials" ON "public"."webauthn_credentials" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "insert_policy" ON "public"."tags" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."liquidity_pools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_account_credentials" ON "public"."send_account_credentials" FOR SELECT TO "authenticated" USING (("auth"."uid"() = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));



CREATE POLICY "select_own_accounts" ON "public"."send_accounts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_own_credentials" ON "public"."webauthn_credentials" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "select_policy" ON "public"."tags" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."send_account_created" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_account_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_account_receives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_account_signing_key_added" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_account_signing_key_removed" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_account_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_earn_create" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "send_earn_create viewable by authenticated users" ON "public"."send_earn_create" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."send_earn_deposit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_earn_new_affiliate" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "send_earn_new_affiliate viewable by authenticated users" ON "public"."send_earn_new_affiliate" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."send_earn_withdraw" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_liquidity_pools" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_revenues_safe_receives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_slash" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_token_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."send_token_v0_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sendpot_jackpot_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sendpot_user_ticket_purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sendtag_checkout_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."swap_routers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tag_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_account_credentials" ON "public"."send_account_credentials" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "send_accounts"."user_id"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."id" = "send_account_credentials"."account_id"))));



CREATE POLICY "update_own_accounts" ON "public"."send_accounts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "update_own_credentials" ON "public"."webauthn_credentials" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "update_policy" ON "public"."tags" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users can see own signing key removed" ON "public"."send_account_signing_key_removed" FOR SELECT USING ((("lower"("concat"('0x', "encode"("account", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "users can see their own ETH receives" ON "public"."send_account_receives" FOR SELECT USING (((("lower"("concat"('0x', "encode"("sender", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (("lower"("concat"('0x', "encode"("log_addr", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "users can see their own account created" ON "public"."send_account_created" FOR SELECT USING ((("lower"("concat"('0x', "encode"("account", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "users can see their own send_earn_deposit" ON "public"."send_earn_deposit" FOR SELECT USING ((("lower"("concat"('0x', "encode"("owner", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "users can see their own send_earn_withdraw" ON "public"."send_earn_withdraw" FOR SELECT USING ((("lower"("concat"('0x', "encode"("owner", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "users can see their own sendtag_checkout_receipts" ON "public"."sendtag_checkout_receipts" FOR SELECT USING ((("lower"("concat"('0x', "encode"("sender", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "users can see their own ticket purchases" ON "public"."sendpot_user_ticket_purchases" FOR SELECT USING ((("lower"("concat"('0x', "encode"("recipient", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "sa"."address"
   FROM "public"."send_accounts" "sa"
  WHERE ("sa"."user_id" = "auth"."uid"()))));



CREATE POLICY "users can see their own transfers" ON "public"."send_account_transfers" FOR SELECT USING (((("lower"("concat"('0x', "encode"("f", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (("lower"("concat"('0x', "encode"("t", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."webauthn_credentials" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "temporal"."send_account_transfers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users can see their own temporal transfers" ON "temporal"."send_account_transfers" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






GRANT USAGE ON SCHEMA "temporal" TO "authenticated";
GRANT USAGE ON SCHEMA "temporal" TO "service_role";









GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";




































































































































































































































































































































REVOKE ALL ON FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "tags" "text"[]) FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "referred_id" "uuid") FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."insert_referral_on_create"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."insert_referral_on_deposit"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."insert_referral_on_new_affiliate"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."send_earn_deposit_trigger_delete_activity"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."send_earn_deposit_trigger_insert_activity"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."send_earn_withdraw_trigger_delete_activity"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."send_earn_withdraw_trigger_insert_activity"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"("distribution_number" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."chain_addresses_after_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."chain_addresses_after_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



REVOKE ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON TABLE "public"."send_accounts" TO "anon";
GRANT ALL ON TABLE "public"."send_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."send_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."webauthn_credentials" TO "anon";
GRANT ALL ON TABLE "public"."webauthn_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."webauthn_credentials" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."favourite_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "service_role";




REVOKE ALL ON FUNCTION "public"."get_affiliate_referrals"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_affiliate_stats_summary"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_stats_summary"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_friends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_friends"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_friends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_jackpot_tickets_purchased"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_jackpot_summary"("num_runs" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_challenge"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_create_passkey_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_send_slash"("distribution_number" integer, "scaling_divisor" integer, "minimum_sends" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_send_streak_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_send_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_tag_referral_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_tag_registration_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_total_referral_verifications"("distribution_num" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_create_passkey"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_referral"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_referral"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_referral"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_referral"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_send_ceiling"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_sends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_sends"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_tag_registration"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_value"("distribution_number" integer, "type" "public"."verification_type", "fixed_value" numeric, "bips_value" integer, "multiplier_min" numeric, "multiplier_max" numeric, "multiplier_step" numeric) TO "service_role";



REVOKE ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."query_webauthn_credentials_by_phone"("phone_number" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."recent_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_delete_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_added_trigger_insert_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_accounts_after_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_create" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_create" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_create" TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "anon";
GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_current_timestamp_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."stop_change_send_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stop_change_send_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



REVOKE ALL ON FUNCTION "public"."sum_qualification_sends"("distribution_number" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sum_qualification_sends"("distribution_number" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "service_role";



GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profiles_send_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



REVOKE ALL ON FUNCTION "public"."tags"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "service_role";



REVOKE ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



REVOKE ALL ON FUNCTION "public"."today_birthday_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_affiliate_stats_on_transfer"() TO "service_role";



GRANT ALL ON TABLE "public"."distribution_shares" TO "anon";
GRANT ALL ON TABLE "public"."distribution_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_shares" TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_referral_verifications"("distribution_id" integer, "shares" "public"."distribution_shares"[]) TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."user_referrals_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."temporal_transfer_after_upsert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_transfer_after_upsert"() TO "service_role";



REVOKE ALL ON FUNCTION "temporal"."temporal_transfer_before_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_transfer_before_insert"() TO "service_role";



GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";


















GRANT ALL ON TABLE "public"."activity" TO "anon";
GRANT ALL ON TABLE "public"."activity" TO "authenticated";
GRANT ALL ON TABLE "public"."activity" TO "service_role";



GRANT ALL ON TABLE "public"."activity_feed" TO "anon";
GRANT ALL ON TABLE "public"."activity_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_feed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."affiliate_stats" TO "anon";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."affiliate_stats" TO "service_role";



GRANT ALL ON TABLE "public"."chain_addresses" TO "anon";
GRANT ALL ON TABLE "public"."chain_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."chain_addresses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_credentials" TO "anon";
GRANT ALL ON TABLE "public"."send_account_credentials" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_credentials" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_account_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."send_token_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_token_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_token_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "anon";
GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."sendtag_checkout_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_metrics" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distribution_shares_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."distribution_verification_values" TO "anon";
GRANT ALL ON TABLE "public"."distribution_verification_values" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_verification_values" TO "service_role";



GRANT ALL ON TABLE "public"."distribution_verifications" TO "anon";
GRANT ALL ON TABLE "public"."distribution_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."distribution_verifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distribution_verifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."distributions" TO "anon";
GRANT ALL ON TABLE "public"."distributions" TO "authenticated";
GRANT ALL ON TABLE "public"."distributions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."distributions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."liquidity_pools" TO "anon";
GRANT ALL ON TABLE "public"."liquidity_pools" TO "authenticated";
GRANT ALL ON TABLE "public"."liquidity_pools" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."receipts_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."referrer" TO "anon";
GRANT ALL ON TABLE "public"."referrer" TO "authenticated";
GRANT ALL ON TABLE "public"."referrer" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_created" TO "anon";
GRANT ALL ON TABLE "public"."send_account_created" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_created" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_created_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_receives" TO "anon";
GRANT ALL ON TABLE "public"."send_account_receives" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_receives" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_signing_key_added" TO "anon";
GRANT ALL ON TABLE "public"."send_account_signing_key_added" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_signing_key_added" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_account_signing_key_added_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_added_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_added_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "anon";
GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_deposit" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_deposit" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_deposit" TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_withdraw" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_withdraw" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_withdraw" TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_activity" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_activity" TO "service_role";



GRANT ALL ON TABLE "public"."send_earn_balances" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_balances" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_earn_create_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_earn_create_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_earn_create_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_earn_deposit_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_earn_deposit_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_earn_deposit_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_earn_new_affiliate_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_earn_new_affiliate_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_earn_new_affiliate_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_earn_withdraw_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_earn_withdraw_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_earn_withdraw_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "anon";
GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "authenticated";
GRANT ALL ON TABLE "public"."send_liquidity_pools" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_liquidity_pools_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "anon";
GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "authenticated";
GRANT ALL ON TABLE "public"."send_revenues_safe_receives" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_revenues_safe_receives_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_slash" TO "anon";
GRANT ALL ON TABLE "public"."send_slash" TO "authenticated";
GRANT ALL ON TABLE "public"."send_slash" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_jackpot_runs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_jackpot_runs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "anon";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."sendpot_user_ticket_purchases" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendpot_user_ticket_purchases_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."sendtag_checkout_receipts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."swap_routers" TO "anon";
GRANT ALL ON TABLE "public"."swap_routers" TO "authenticated";
GRANT ALL ON TABLE "public"."swap_routers" TO "service_role";



GRANT ALL ON TABLE "public"."tag_receipts" TO "anon";
GRANT ALL ON TABLE "public"."tag_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_receipts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."workflow_ids" TO "anon";
GRANT ALL ON TABLE "public"."workflow_ids" TO "authenticated";
GRANT ALL ON TABLE "public"."workflow_ids" TO "service_role";



GRANT ALL ON TABLE "temporal"."send_account_transfers" TO "service_role";
GRANT SELECT ON TABLE "temporal"."send_account_transfers" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "temporal"."send_account_transfers_id_seq" TO "service_role";



GRANT ALL ON TABLE "temporal"."send_earn_deposits" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "temporal" GRANT ALL ON FUNCTIONS  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "temporal" GRANT ALL ON TABLES  TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" REVOKE ALL ON FUNCTIONS  FROM PUBLIC;



























RESET ALL;
