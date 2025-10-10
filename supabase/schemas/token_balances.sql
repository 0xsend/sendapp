-- token_balances (Temporal-driven): single source-of-truth rows
-- Keep reads simple; balances are written by Temporal activities after
-- confirmed transfers. No advancer/cursor/functions here.

-- Balances table (global per-user balances per token or native asset)
CREATE TABLE IF NOT EXISTS public.token_balances (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  address public.citext NOT NULL,
  chain_id integer NOT NULL,
  token bytea NULL, -- NULL reserved for native ETH in future
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  token_key text GENERATED ALWAYS AS (
    CASE WHEN token IS NULL THEN 'eth' ELSE encode(token, 'hex') END
  ) STORED
);

-- Foreign keys
ALTER TABLE ONLY public.token_balances
  ADD CONSTRAINT token_balances_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Helpful indexes and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS token_balances_user_token_key_uniq
  ON public.token_balances (user_id, token_key);
CREATE INDEX IF NOT EXISTS token_balances_token_user_idx
  ON public.token_balances (token, user_id);
CREATE INDEX IF NOT EXISTS token_balances_token_balance_idx
  ON public.token_balances (token, balance);
CREATE INDEX IF NOT EXISTS token_balances_address_idx
  ON public.token_balances (address, chain_id);

-- Enable direct SELECT with RLS: users see their own rows
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;

create policy "Users can see their own token balances"
on "public"."token_balances"
as permissive
for select
to authenticated
using ((select auth.uid()) = user_id);

GRANT ALL ON TABLE "public"."token_balances" TO "anon";
GRANT ALL ON TABLE "public"."token_balances" TO "authenticated";
GRANT ALL ON TABLE public.token_balances TO "service_role";

-- Update balances on SEND token transfers (deposits), skip internal transfers

CREATE OR REPLACE FUNCTION public.send_token_transfers_update_token_balances()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _from_is_send boolean := false;
  _recipient_address citext;
  _user_id uuid;
  _now_ts timestamptz;
  _active_distribution_id bigint;
  _hodler_min_balance numeric;
  _current_balance numeric;
BEGIN
  _recipient_address := lower(concat('0x', encode(NEW.t, 'hex')))::citext;
  _now_ts := to_timestamp(NEW.block_time) AT TIME ZONE 'UTC';

  SELECT EXISTS (
    SELECT 1
    FROM public.send_accounts sa
    WHERE sa.address = lower(concat('0x', encode(NEW.f, 'hex')))::citext
      AND sa.chain_id = NEW.chain_id::int
  ) INTO _from_is_send;

  IF _from_is_send THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.token_balances (user_id, address, chain_id, token, balance, updated_at)
  SELECT sa.user_id,
         _recipient_address,
         NEW.chain_id::int,
         NEW.log_addr,
         NEW.v,
         _now_ts
  FROM public.send_accounts sa
  WHERE sa.address = _recipient_address
    AND sa.chain_id = NEW.chain_id::int
  ON CONFLICT (user_id, token_key)
  DO UPDATE SET
    balance    = public.token_balances.balance + EXCLUDED.balance,
    address    = EXCLUDED.address,
    chain_id   = EXCLUDED.chain_id,
    updated_at = EXCLUDED.updated_at
  RETURNING user_id INTO _user_id;

  IF _user_id IS NULL THEN
    RETURN NEW;
  END IF;

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

  SELECT balance INTO _current_balance
  FROM public.token_balances
  WHERE user_id = _user_id
    AND token = NEW.log_addr;

  IF _current_balance IS NULL THEN
    RETURN NEW;
  END IF;

  IF _current_balance > _hodler_min_balance THEN
    IF EXISTS (
      SELECT 1 FROM public.distribution_verifications dv
      WHERE dv.distribution_id = _active_distribution_id
        AND dv.user_id = _user_id
        AND dv.type = 'send_token_hodler'
    ) THEN
      UPDATE public.distribution_verifications
      SET weight = _current_balance,
          metadata = jsonb_build_object('token', encode(NEW.log_addr,'hex'))
      WHERE distribution_id = _active_distribution_id
        AND user_id = _user_id
        AND type = 'send_token_hodler';
    ELSE
      INSERT INTO public.distribution_verifications (distribution_id, user_id, type, metadata, weight)
      VALUES (
        _active_distribution_id,
        _user_id,
        'send_token_hodler',
        jsonb_build_object('token', encode(NEW.log_addr,'hex')),
        _current_balance
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE TRIGGER send_token_transfers_trigger_update_token_balances
AFTER INSERT ON public.send_token_transfers
FOR EACH ROW EXECUTE FUNCTION public.send_token_transfers_update_token_balances();
