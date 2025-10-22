create sequence "public"."token_balances_id_seq";

alter type "public"."verification_type" add value if not exists 'send_token_hodler' after 'send_ceiling';

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

CREATE OR REPLACE FUNCTION public.send_account_receives_update_token_balances()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _to_user_id uuid;
  _to_address citext;
  _from_is_send boolean := false;
BEGIN
  -- Recipient address is NEW.log_addr
  SELECT sa.user_id
    INTO _to_user_id
  FROM public.send_accounts sa
  WHERE sa.address = concat('0x', encode(NEW.log_addr, 'hex'))::citext
    AND sa.chain_id = NEW.chain_id::int
  LIMIT 1;

  -- Sender is a Send Account? If yes, this is an internal transfer; let workflow handle it.
  SELECT EXISTS (
    SELECT 1
    FROM public.send_accounts sa
    WHERE sa.address = concat('0x', encode(NEW.sender, 'hex'))::citext
      AND sa.chain_id = NEW.chain_id::int
  ) INTO _from_is_send;

  -- Only update balances for deposits: recipient is a Send Account, sender is NOT a Send Account
  IF _to_user_id IS NOT NULL AND NOT _from_is_send THEN
    _to_address := concat('0x', encode(NEW.log_addr, 'hex'))::citext;

    INSERT INTO public.token_balances (user_id, address, chain_id, token, balance, updated_at)
    VALUES (
      _to_user_id,
      _to_address,
      NEW.chain_id::int,
      NULL,
      NEW.value,
      to_timestamp(NEW.block_time) at time zone 'UTC'
    )
    ON CONFLICT (user_id, token_key)
    DO UPDATE SET
      balance    = public.token_balances.balance + EXCLUDED.balance,
      address    = EXCLUDED.address,
      chain_id   = EXCLUDED.chain_id,
      updated_at = EXCLUDED.updated_at;
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
using ((select auth.uid() = user_id));


CREATE TRIGGER send_account_receives_trigger_update_token_balances AFTER INSERT ON public.send_account_receives FOR EACH ROW EXECUTE FUNCTION public.send_account_receives_update_token_balances();


