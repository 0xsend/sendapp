-- Functions
CREATE OR REPLACE FUNCTION "public"."send_account_receives_delete_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity where event_name = 'send_account_receives' and event_id = OLD.event_id;
    return OLD;
end;
$$;
ALTER FUNCTION "public"."send_account_receives_delete_activity_trigger"() OWNER TO "postgres";

create or replace function send_account_receives_insert_activity_trigger() returns trigger
language plpgsql
security definer as
$$
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

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_account_receives_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_account_receives_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_account_receives" (
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL,
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

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_account_receives_id_seq" OWNED BY "public"."send_account_receives"."id";
ALTER TABLE ONLY "public"."send_account_receives" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_receives_id_seq"'::regclass);

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_account_receives"
    ADD CONSTRAINT "send_account_receives_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "i_send_account_receives_log_addr" ON "public"."send_account_receives" USING "btree" ("log_addr");
CREATE INDEX "i_send_account_receives_sender" ON "public"."send_account_receives" USING "btree" ("sender");
CREATE INDEX "send_account_receives_block_num" ON "public"."send_account_receives" USING "btree" ("block_num");
CREATE INDEX "send_account_receives_block_time" ON "public"."send_account_receives" USING "btree" ("block_time");
CREATE UNIQUE INDEX "u_send_account_receives" ON "public"."send_account_receives" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Triggers
CREATE OR REPLACE TRIGGER "send_account_receives_delete_activity_trigger" AFTER DELETE ON "public"."send_account_receives" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_receives_delete_activity_trigger"();
CREATE OR REPLACE TRIGGER "send_account_receives_insert_activity_trigger" AFTER INSERT ON "public"."send_account_receives" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_receives_insert_activity_trigger"();

-- Trigger: update token_balances on ETH/SEND receives (for deposits)
-- Adds NEW.value to the recipient balance when a Send Account receives; token is NULL (native) for now.
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

ALTER FUNCTION public.send_account_receives_update_token_balances() OWNER TO postgres;

CREATE OR REPLACE TRIGGER send_account_receives_trigger_update_token_balances
AFTER INSERT ON public.send_account_receives
FOR EACH ROW
EXECUTE FUNCTION public.send_account_receives_update_token_balances();

-- RLS
ALTER TABLE "public"."send_account_receives" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see their own ETH receives" ON "public"."send_account_receives" FOR SELECT USING (((("lower"("concat"('0x', "encode"("sender", 'hex'::text))))::citext OPERATOR(=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (("lower"("concat"('0x', "encode"("log_addr", 'hex'::text))))::citext OPERATOR(=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

-- Grants
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_receives_delete_activity_trigger"() TO "service_role";
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_receives_insert_activity_trigger"() TO "service_role";
GRANT ALL ON TABLE "public"."send_account_receives" TO "anon";
GRANT ALL ON TABLE "public"."send_account_receives" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_receives" TO "service_role";
GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_receives_id_seq" TO "service_role";
