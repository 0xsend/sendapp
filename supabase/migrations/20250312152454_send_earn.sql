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
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_earn_deposit with no send_account_created.
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
CREATE OR REPLACE FUNCTION private.aab_send_earn_deposit_trigger_insert_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _owner_user_id uuid;
    _data jsonb;
BEGIN
    -- Select send app info for owner address (the Send account owner)
    SELECT user_id INTO _owner_user_id
    FROM send_accounts
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
    INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    VALUES (
        'send_earn_deposit',
        NEW.event_id,
        _owner_user_id,  -- In this case from_user is the owner
        NULL,            -- No to_user for deposits
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

-- Create trigger on send_earn_deposit table
CREATE TRIGGER aab_send_earn_deposit_trigger_insert_activity
AFTER INSERT ON public.send_earn_deposit
FOR EACH ROW
EXECUTE FUNCTION private.aab_send_earn_deposit_trigger_insert_activity();

-- Also add delete triggers to maintain consistency
CREATE OR REPLACE FUNCTION private.aaa_send_earn_deposit_trigger_delete_activity()
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
EXECUTE FUNCTION private.aaa_send_earn_deposit_trigger_delete_activity();

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
create or replace function private.aaa_filter_send_earn_withdraw_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_earn_withdraw with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_earn_withdraw with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_earn_withdraw with no send_account_created.
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
execute function private.aaa_filter_send_earn_withdraw_with_no_send_account_created();


-- Trigger function for send_earn_withdraw
CREATE OR REPLACE FUNCTION private.aab_send_earn_withdraw_trigger_insert_activity()
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
EXECUTE FUNCTION private.aab_send_earn_withdraw_trigger_insert_activity();

CREATE OR REPLACE FUNCTION private.aaa_send_earn_withdraw_trigger_delete_activity()
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
EXECUTE FUNCTION private.aaa_send_earn_withdraw_trigger_delete_activity();


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
BEGIN
  -- Find the referred_id (user who made the deposit)
  SELECT user_id INTO v_referred_id
  FROM send_accounts
  WHERE address = lower(concat('0x', encode(NEW.owner, 'hex'::text)))::citext;

  -- Skip if we can't find the referred user
  IF v_referred_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the referrer_id by joining through the tables
  SELECT sa.user_id INTO v_referrer_id
  FROM send_earn_create c
  JOIN send_earn_new_affiliate a ON c.fee_recipient = a.send_earn_affiliate
  JOIN send_accounts sa ON lower(concat('0x', encode(a.affiliate, 'hex'::text)))::citext = sa.address
  WHERE c.send_earn = NEW.log_addr;

  -- Skip if we can't find the referrer
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this referral relationship already exists
  IF NOT EXISTS (
    SELECT 1 FROM referrals
    WHERE referrer_id = v_referrer_id AND referred_id = v_referred_id
  ) THEN
    -- Insert the new referral relationship
    INSERT INTO referrals (referrer_id, referred_id, created_at)
    VALUES (v_referrer_id, v_referred_id, NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on send_earn_deposit table
CREATE TRIGGER insert_referral_on_deposit
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
  v_deposit_owner bytea;
BEGIN
  -- Find the referrer_id (the affiliate)
  SELECT user_id INTO v_referrer_id
  FROM send_accounts
  WHERE address = lower(concat('0x', encode(NEW.affiliate, 'hex'::text)))::citext;

  -- Skip if we can't find the referrer user
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find a deposit with the same transaction hash
  SELECT owner INTO v_deposit_owner
  FROM send_earn_deposit
  WHERE tx_hash = NEW.tx_hash
  LIMIT 1;

  -- Skip if we can't find a deposit with the same transaction hash
  IF v_deposit_owner IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the referred_id (user who made the deposit)
  SELECT user_id INTO v_referred_id
  FROM send_accounts
  WHERE address = lower(concat('0x', encode(v_deposit_owner, 'hex'::text)))::citext;

  -- Skip if we can't find the referred user
  IF v_referred_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if this referral relationship already exists
  IF NOT EXISTS (
    SELECT 1 FROM referrals
    WHERE referrer_id = v_referrer_id AND referred_id = v_referred_id
  ) THEN
    -- Insert the new referral relationship
    INSERT INTO referrals (referrer_id, referred_id, created_at)
    VALUES (v_referrer_id, v_referred_id, NOW());
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on send_earn_new_affiliate table
CREATE TRIGGER insert_referral_on_new_affiliate
AFTER INSERT ON public.send_earn_new_affiliate
FOR EACH ROW
EXECUTE FUNCTION private.insert_referral_on_new_affiliate();
