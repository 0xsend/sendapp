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

create table "public"."send_earn_deposits" (
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

CREATE UNIQUE INDEX u_send_earn_deposits ON public.send_earn_deposits USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_deposits_owner_idx ON public.send_earn_deposits USING btree (owner, log_addr);

CREATE INDEX send_earn_deposits_block_num ON public.send_earn_deposits USING btree (block_num);

CREATE INDEX send_earn_deposits_block_time ON public.send_earn_deposits USING btree (block_time);

ALTER TABLE public.send_earn_deposits ENABLE ROW LEVEL SECURITY;

create policy
"users can see their own send_earn_deposits"
on "public"."send_earn_deposits" as permissive for
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

-- create trigger function for filtering send_earn_deposits with no send_account_created
create or replace function private.filter_send_earn_deposits_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_earn_deposits with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_earn_deposits with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_earn_deposits with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;

-- create trigger on send_earn_deposits table
create trigger filter_send_earn_deposits_with_no_send_account_created
before insert on public.send_earn_deposits
for each row
execute function private.filter_send_earn_deposits_with_no_send_account_created();

create table "public"."send_earn_withdraws" (
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

CREATE UNIQUE INDEX u_send_earn_withdraws ON public.send_earn_withdraws USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE INDEX send_earn_withdraws_owner_idx ON public.send_earn_withdraws USING btree (owner, log_addr);

CREATE INDEX send_earn_withdraws_block_num ON public.send_earn_withdraws USING btree (block_num);

CREATE INDEX send_earn_withdraws_block_time ON public.send_earn_withdraws USING btree (block_time);

ALTER TABLE public.send_earn_withdraws ENABLE ROW LEVEL SECURITY;

create policy
"users can see their own send_earn_withdraws"
on "public"."send_earn_withdraws" as permissive for
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

-- create trigger function for filtering send_earn_withdraws with no send_account_created
create or replace function private.filter_send_earn_withdraws_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_earn_withdraws with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_earn_withdraws with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_earn_withdraws with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
  if exists ( select 1 from send_account_created where account = new.owner )
  then
    return new;
  else
    return null;
  end if;
end;
$$;

-- create trigger on send_earn_withdraws table
create trigger filter_send_earn_withdraws_with_no_send_account_created
before insert on public.send_earn_withdraws
for each row
execute function private.filter_send_earn_withdraws_with_no_send_account_created();


-- view so users can see their earn balances by vault
create or replace view send_earn_balances with (security_invoker = ON, security_barrier = ON) as
(
with txs as (select log_addr,
                    owner,
                    assets,
                    shares
             from send_earn_deposits
             union
             select log_addr,
                    owner,
                    assets * -1,
                    shares * -1
             from send_earn_withdraws)
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
    d.assets,
    d.shares,
    d.tx_hash
  from send_earn_deposits d
  union all
  select
    'withdraw' as type,
    w.block_num,
    w.block_time,
    w.log_addr,
    w.owner,
    w.assets,
    w.shares,
    w.tx_hash
  from send_earn_withdraws w
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

-- Create trigger on send_earn_deposits table
CREATE TRIGGER insert_referral_on_deposit
AFTER INSERT ON public.send_earn_deposits
FOR EACH ROW
EXECUTE FUNCTION private.insert_referral_on_deposit();
