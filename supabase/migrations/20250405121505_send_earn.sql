create table "public"."send_earn_create" (
    "id" bigint not null generated always as identity,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "send_earn" bytea not null,
    "caller" bytea not null,
    "initial_owner" bytea not null,
    "vault" bytea not null,
    "fee_recipient" bytea not null,
    "collections" bytea not null,
    "fee" numeric not null,
    "salt" bytea not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored
);

ALTER TABLE public.send_earn_create ENABLE ROW LEVEL SECURITY;

create policy
"send_earn_create viewable by authenticated users"
on public.send_earn_create for select
to authenticated using (
    true
);

CREATE UNIQUE INDEX u_send_earn_create ON public.send_earn_create USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_create_send_earn ON public.send_earn_create USING btree (send_earn);

CREATE INDEX send_earn_create_block_num ON public.send_earn_create USING btree (block_num);

CREATE INDEX send_earn_create_block_time ON public.send_earn_create USING btree (block_time);

create table "public"."send_earn_new_affiliate" (
    "id" bigint not null generated always as identity,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "affiliate" bytea not null,
    "send_earn_affiliate" bytea not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored
);

ALTER TABLE public.send_earn_new_affiliate ENABLE ROW LEVEL SECURITY;

create policy
"send_earn_new_affiliate viewable by authenticated users"
on public.send_earn_new_affiliate for select
to authenticated using (
    true
);

CREATE UNIQUE INDEX u_send_earn_new_affiliate ON public.send_earn_new_affiliate USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_new_affiliate_send_earn_affiliate_idx ON public.send_earn_new_affiliate USING btree (send_earn_affiliate);

CREATE INDEX send_earn_new_affiliate_affiliate_idx ON public.send_earn_new_affiliate USING btree (affiliate);

CREATE INDEX send_earn_new_affiliate_block_num ON public.send_earn_new_affiliate USING btree (block_num);

CREATE INDEX send_earn_new_affiliate_block_time ON public.send_earn_new_affiliate USING btree (block_time);

create table "public"."send_earn_deposit" (
    "id" bigint not null generated always as identity,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "sender" bytea not null,
    "owner" bytea not null,
    "assets" numeric not null,
    "shares" numeric not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored
);

CREATE UNIQUE INDEX u_send_earn_deposit ON public.send_earn_deposit USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_deposit_owner_idx ON public.send_earn_deposit USING btree (owner, log_addr);

CREATE INDEX send_earn_deposit_block_num ON public.send_earn_deposit USING btree (block_num);

CREATE INDEX send_earn_deposit_block_time ON public.send_earn_deposit USING btree (block_time);

ALTER TABLE public.send_earn_deposit ENABLE ROW LEVEL SECURITY;

create policy
"users can see their own send_earn_deposit"
on "public"."send_earn_deposit" as permissive for
select
to public using (
    (
        (lower(concat('0x', encode("owner", 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (send_accounts.user_id = (select auth.uid()))
        )
    )
);

set check_function_bodies = off;

-- create trigger function for filtering send_earn_deposit with no send_account_created
create or replace function private.aaa_filter_send_earn_deposit_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_earn_deposit with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_earn_deposit with send_account_created.
-- For now, we index all rows, and use this function filter any send_earn_deposit with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;

-- create trigger on send_earn_deposit table
create trigger aaa_filter_send_earn_deposit_with_no_send_account_created
before insert on public.send_earn_deposit
for each row
execute function private.aaa_filter_send_earn_deposit_with_no_send_account_created();

-- Trigger function for send_earn_deposit
CREATE OR REPLACE FUNCTION private.send_earn_deposit_trigger_insert_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as the function owner (postgres)
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

-- Create trigger on send_earn_deposit table
CREATE TRIGGER aab_send_earn_deposit_trigger_insert_activity
AFTER INSERT ON public.send_earn_deposit
FOR EACH ROW
EXECUTE FUNCTION private.send_earn_deposit_trigger_insert_activity();

-- Also add delete triggers to maintain consistency
CREATE OR REPLACE FUNCTION private.send_earn_deposit_trigger_delete_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM activity
    WHERE event_id = OLD.event_id
        AND event_name = 'send_earn_deposit';
    RETURN OLD;
END;
$$;

CREATE TRIGGER aaa_send_earn_deposit_trigger_delete_activity
AFTER DELETE ON public.send_earn_deposit
FOR EACH ROW
EXECUTE FUNCTION private.send_earn_deposit_trigger_delete_activity();

create table "public"."send_earn_withdraw" (
    "id" bigint not null generated always as identity,
    "chain_id" numeric not null,
    "log_addr" bytea not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    "sender" bytea not null,
    "receiver" bytea not null,
    "owner" bytea not null,
    "assets" numeric not null,
    "shares" numeric not null,
    "ig_name" text not null,
    "src_name" text not null,
    "block_num" numeric not null,
    "tx_idx" integer not null,
    "log_idx" integer not null,
    "abi_idx" smallint not null,
    event_id text not null generated always as (
      ig_name
      || '/'
      || src_name
      || '/'
      || block_num::text
      || '/'
      || tx_idx::text
      || '/'
      || log_idx::text
  ) stored
);

CREATE UNIQUE INDEX u_send_earn_withdraw ON public.send_earn_withdraw USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_withdraw_owner_idx ON public.send_earn_withdraw USING btree (owner, log_addr);

CREATE INDEX send_earn_withdraw_block_num ON public.send_earn_withdraw USING btree (block_num);

CREATE INDEX send_earn_withdraw_block_time ON public.send_earn_withdraw USING btree (block_time);

ALTER TABLE public.send_earn_withdraw ENABLE ROW LEVEL SECURITY;

create policy
"users can see their own send_earn_withdraw"
on "public"."send_earn_withdraw" as permissive for
select
to public using (
    (
        (lower(concat('0x', encode("owner", 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (send_accounts.user_id = (select auth.uid()))
        )
    )
);

set check_function_bodies = off;

-- create trigger function for filtering send_earn_withdraw with no send_account_created
create or replace function private.filter_send_earn_withdraw_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_earn_withdraw with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_earn_withdraw with send_account_created.
-- For now, we index all rows, and use this function filter any send_earn_withdraw with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;

-- create trigger on send_earn_withdraw table
create trigger aaa_filter_send_earn_withdraw_with_no_send_account_created
before insert on public.send_earn_withdraw
for each row
execute function private.filter_send_earn_withdraw_with_no_send_account_created();


-- Trigger function for send_earn_withdraw
CREATE OR REPLACE FUNCTION private.send_earn_withdraw_trigger_insert_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger on send_earn_withdraw table
CREATE TRIGGER aab_send_earn_withdraw_trigger_insert_activity
AFTER INSERT ON public.send_earn_withdraw
FOR EACH ROW
EXECUTE FUNCTION private.send_earn_withdraw_trigger_insert_activity();

CREATE OR REPLACE FUNCTION private.send_earn_withdraw_trigger_delete_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM activity
    WHERE event_id = OLD.event_id
        AND event_name = 'send_earn_withdraw';
    RETURN OLD;
END;
$$;

CREATE TRIGGER aaa_send_earn_withdraw_trigger_delete_activity
AFTER DELETE ON public.send_earn_withdraw
FOR EACH ROW
EXECUTE FUNCTION private.send_earn_withdraw_trigger_delete_activity();


-- view so users can see their earn balances by vault
create or replace view send_earn_balances with (security_invoker = ON, security_barrier = ON) as
(
with txs as (select log_addr,
                    owner,
                    assets,
                    shares
             from send_earn_deposit
             union
             select log_addr,
                    owner,
                    assets * -1,
                    shares * -1
             from send_earn_withdraw)
select t.log_addr,
       t.owner,
       sum(t.assets) as assets,
       sum(t.shares) as shares
from txs t
group by t.log_addr, t.owner
);

-- view so users can see their earn activity by vault
create or replace view send_earn_activity with (security_invoker = ON, security_barrier = ON) as
(
  select
    'deposit' as type,
    d.block_num,
    d.block_time,
    d.log_addr,
    d.owner,
    d.sender,
    d.assets,
    d.shares,
    d.tx_hash
  from send_earn_deposit d
  union all
  select
    'withdraw' as type,
    w.block_num,
    w.block_time,
    w.log_addr,
    w.owner,
    w.sender,
    w.assets,
    w.shares,
    w.tx_hash
  from send_earn_withdraw w
  order by block_time desc
);

-- function to create a computed relationship between send_earn_create and send_earn_new_affiliate to find affiliate vault
create or replace function send_earn_affiliate_vault(send_earn_new_affiliate) returns setof send_earn_create rows 1 as $$
select * from send_earn_create where fee_recipient = $1.send_earn_affiliate
$$ stable language sql;

-- Create trigger function to insert referral relationship when a new deposit is made
CREATE OR REPLACE FUNCTION private.insert_referral_on_deposit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger on send_earn_deposit table
CREATE TRIGGER aac_insert_referral_on_deposit
AFTER INSERT ON public.send_earn_deposit
FOR EACH ROW
EXECUTE FUNCTION private.insert_referral_on_deposit();

-- Create trigger function to insert referral relationship when a new affiliate is created
CREATE OR REPLACE FUNCTION private.insert_referral_on_new_affiliate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger on send_earn_new_affiliate table
CREATE TRIGGER insert_referral_on_new_affiliate
AFTER INSERT ON public.send_earn_new_affiliate
FOR EACH ROW
EXECUTE FUNCTION private.insert_referral_on_new_affiliate();

-- Create trigger function to insert referral relationship when a send_earn_create is indexed
CREATE OR REPLACE FUNCTION private.insert_referral_on_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger on send_earn_create table
CREATE TRIGGER insert_referral_on_create
AFTER INSERT ON public.send_earn_create
FOR EACH ROW
EXECUTE FUNCTION private.insert_referral_on_create();

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

create type temporal_status as enum (
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed'
);

-- Create the temporal.send_earn_deposits table
CREATE TABLE temporal.send_earn_deposits (
    workflow_id text PRIMARY KEY,
    status temporal_status NOT NULL DEFAULT 'initialized',
    owner bytea,
    assets numeric,
    vault bytea,
    user_op_hash bytea,
    block_num numeric,
    activity_id bigint,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_temporal_send_earn_deposits_created_at ON temporal.send_earn_deposits(created_at);
CREATE INDEX idx_temporal_send_earn_deposits_status_owner_block_num ON temporal.send_earn_deposits(status, owner, block_num);
CREATE INDEX idx_temporal_send_earn_deposits_activity_id ON temporal.send_earn_deposits(activity_id);

-- Add foreign key constraint to public.activity
ALTER TABLE temporal.send_earn_deposits
ADD CONSTRAINT fk_activity
FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON DELETE CASCADE;

-- Add trigger to automatically update updated_at
CREATE TRIGGER set_temporal_send_earn_deposits_updated_at
BEFORE UPDATE ON temporal.send_earn_deposits
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Trigger function to insert pending activity
-- Needs access to public.activity and public.chain_addresses
CREATE OR REPLACE FUNCTION temporal.temporal_deposit_insert_pending_activity()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER aaa_temporal_deposit_insert_pending_activity
AFTER INSERT ON temporal.send_earn_deposits
FOR EACH ROW
EXECUTE FUNCTION temporal.temporal_deposit_insert_pending_activity();

-- Function to update the linked activity record when temporal deposit status changes
CREATE OR REPLACE FUNCTION temporal.temporal_deposit_update_activity_on_status_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the function after update on temporal.send_earn_deposits
CREATE TRIGGER aab_temporal_deposit_update_activity_on_status_change
AFTER UPDATE ON temporal.send_earn_deposits
FOR EACH ROW
EXECUTE FUNCTION temporal.temporal_deposit_update_activity_on_status_change();

-- Grant permissions for service_role on the temporal schema and its tables
GRANT USAGE ON SCHEMA temporal TO service_role;
GRANT ALL ON TABLE temporal.send_earn_deposits TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA temporal GRANT ALL ON TABLES TO service_role;
