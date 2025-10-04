create sequence "public"."token_balances_id_seq";

alter type "public"."verification_type" add value if not exists 'token_hodler' after 'send_ceiling';

create table "public"."token_balances" (
    "id" bigint not null default nextval('token_balances_id_seq'::regclass),
    "user_id" uuid not null,
    "address" citext not null,
    "chain_id" integer not null,
    "token" bytea,
    "balance" numeric not null default 0,
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "token_key" text generated always as (
CASE
    WHEN (token IS NULL) THEN 'eth'::text
    ELSE encode(token, 'hex'::text)
END) stored
);


alter table "public"."token_balances" enable row level security;;

alter sequence "public"."token_balances_id_seq" owned by "public"."token_balances"."id";

CREATE INDEX token_balances_address_idx ON public.token_balances USING btree (address, chain_id);

CREATE UNIQUE INDEX token_balances_pkey ON public.token_balances USING btree (id);

CREATE INDEX token_balances_token_balance_idx ON public.token_balances USING btree (token, balance);

CREATE INDEX token_balances_token_user_idx ON public.token_balances USING btree (token, user_id);

CREATE UNIQUE INDEX token_balances_user_token_key_uniq ON public.token_balances USING btree (user_id, token_key);

alter table "public"."token_balances" add constraint "token_balances_pkey" PRIMARY KEY using index "token_balances_pkey";

alter table "public"."token_balances" add constraint "token_balances_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."token_balances" validate constraint "token_balances_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_token_transfers_update_token_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sender_is_send_account boolean := false;
  _recipient_is_send_account boolean := false;
  _recipient_address citext;
  _recipient_user_id uuid;
  _transfer_timestamp timestamptz;
  _active_distribution_id bigint;
  _hodler_min_balance numeric;
  _recipient_current_balance numeric;
BEGIN
  _recipient_address := lower(concat('0x', encode(NEW.t, 'hex')))::citext;
  _transfer_timestamp := to_timestamp(NEW.block_time) AT TIME ZONE 'UTC';

  -- Check if sender is a Send Account
  SELECT EXISTS (
    SELECT 1
    FROM public.send_accounts sa
    WHERE sa.address = lower(concat('0x', encode(NEW.f, 'hex')))::citext
      AND sa.chain_id = NEW.chain_id::int
  ) INTO _sender_is_send_account;

  -- Check if recipient is a Send Account
  SELECT EXISTS (
    SELECT 1
    FROM public.send_accounts sa
    WHERE sa.address = _recipient_address
      AND sa.chain_id = NEW.chain_id::int
  ) INTO _recipient_is_send_account;

  -- Skip internal transfers where both sender and recipient are Send Accounts
  IF _sender_is_send_account AND _recipient_is_send_account THEN
    RETURN NEW;
  END IF;

  -- Upsert balance for recipient if they are a Send Account (derive user_id inline)
  INSERT INTO public.token_balances (user_id, address, chain_id, token, balance, updated_at)
  SELECT sa.user_id,
         _recipient_address,
         NEW.chain_id::int,
         NEW.log_addr,
         NEW.v,
         _transfer_timestamp
  FROM public.send_accounts sa
  WHERE sa.address = _recipient_address
    AND sa.chain_id = NEW.chain_id::int
  ON CONFLICT (user_id, token_key)
  DO UPDATE SET
    balance    = public.token_balances.balance + EXCLUDED.balance,
    address    = EXCLUDED.address,
    chain_id   = EXCLUDED.chain_id,
    updated_at = EXCLUDED.updated_at
  RETURNING user_id INTO _recipient_user_id;

  -- If recipient is not a Send Account, nothing more to do
  IF _recipient_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Active distribution and threshold
  WITH now_utc AS (
    SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
  ), active AS (
    SELECT id, hodler_min_balance
    FROM public.distributions, now_utc n
    WHERE n.now_ts >= qualification_start
      AND n.now_ts <  qualification_end
    ORDER BY qualification_start DESC
    LIMIT 1
  )
  SELECT a.id, a.hodler_min_balance INTO _active_distribution_id, _hodler_min_balance FROM active a;

  IF _active_distribution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Current balance for this user/token
  SELECT balance INTO _recipient_current_balance
  FROM public.token_balances
  WHERE user_id = _recipient_user_id
    AND token = NEW.log_addr;

  IF _recipient_current_balance IS NULL THEN
    RETURN NEW;
  END IF;

  -- Manual upsert for distribution_verifications (no unique index)
  IF EXISTS (
    SELECT 1 FROM public.distribution_verifications dv
    WHERE dv.distribution_id = _active_distribution_id
      AND dv.user_id = _recipient_user_id
      AND dv.type = 'token_hodler'
  ) THEN
    UPDATE public.distribution_verifications
    SET weight = _recipient_current_balance,
        metadata = jsonb_build_object('token', encode(NEW.log_addr,'hex'))
    WHERE distribution_id = _active_distribution_id
      AND user_id = _recipient_user_id
      AND type = 'token_hodler';
  ELSE
    INSERT INTO public.distribution_verifications (distribution_id, user_id, type, metadata, weight)
    VALUES (
      _active_distribution_id,
      _recipient_user_id,
      'token_hodler',
      jsonb_build_object('token', encode(NEW.log_addr,'hex')),
      _recipient_current_balance
    );
  END IF;

  RETURN NEW;
END;
$function$;

GRANT ALL ON TABLE "public"."token_balances" TO "anon";
GRANT ALL ON TABLE "public"."token_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."token_balances" TO "service_role";

create policy "Users can see their own token balances"
on "public"."token_balances"
as permissive
for select
to authenticated
using ((select auth.uid()) = user_id);


-- Replace native deposit trigger with SEND token transfer trigger
CREATE OR REPLACE TRIGGER send_token_transfers_trigger_update_token_balances
AFTER INSERT ON public.send_token_transfers
FOR EACH ROW EXECUTE FUNCTION public.send_token_transfers_update_token_balances();


