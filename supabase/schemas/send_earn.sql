-- Tables (must be created before functions that reference them)

-- Table: send_earn_create
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
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL
);

ALTER TABLE "public"."send_earn_create" OWNER TO "postgres";

-- Sequence for send_earn_create
ALTER TABLE "public"."send_earn_create" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_create_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Table: send_earn_new_affiliate
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
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL
);

ALTER TABLE "public"."send_earn_new_affiliate" OWNER TO "postgres";

-- Sequence for send_earn_new_affiliate
ALTER TABLE "public"."send_earn_new_affiliate" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_new_affiliate_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Table: send_earn_deposit
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
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL
);

ALTER TABLE "public"."send_earn_deposit" OWNER TO "postgres";

-- Sequence for send_earn_deposit
ALTER TABLE "public"."send_earn_deposit" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_deposit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

-- Table: send_earn_withdraw
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
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL
);

ALTER TABLE "public"."send_earn_withdraw" OWNER TO "postgres";

-- Sequence for send_earn_withdraw
ALTER TABLE "public"."send_earn_withdraw" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."send_earn_withdraw_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);-- Functions

CREATE OR REPLACE FUNCTION private.aaa_filter_send_earn_deposit_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

ALTER FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION private.filter_send_earn_withdraw_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

ALTER FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"() OWNER TO "postgres";

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

CREATE OR REPLACE FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") RETURNS SETOF "public"."send_earn_create"
    LANGUAGE "sql" STABLE ROWS 1
    AS $_$
select * from send_earn_create where fee_recipient = $1.send_earn_affiliate
$_$;

ALTER FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") OWNER TO "postgres";

-- Views
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

CREATE OR REPLACE VIEW "public"."send_earn_balances_timeline" WITH ("security_invoker"='on', "security_barrier"='on') AS
WITH all_transactions AS (
    SELECT log_addr,owner, block_time, block_num, assets, shares
    FROM send_earn_deposit
    UNION ALL
    SELECT log_addr, owner, block_time, block_num, -assets, -shares
    FROM send_earn_withdraw
)
SELECT
    log_addr,
    owner,
    block_time,
    block_num,
    SUM(assets) OVER (
        PARTITION BY log_addr, owner
        ORDER BY block_num
        ROWS UNBOUNDED PRECEDING
    ) as assets,
    SUM(shares) OVER (
        PARTITION BY log_addr, owner
        ORDER BY block_num
        ROWS UNBOUNDED PRECEDING
    ) as shares
FROM all_transactions
ORDER BY block_num;

ALTER TABLE "public"."send_earn_balances_timeline" OWNER TO "postgres";

-- Indexes
CREATE INDEX "send_earn_create_block_num" ON "public"."send_earn_create" USING "btree" ("block_num");
CREATE INDEX "send_earn_create_block_time" ON "public"."send_earn_create" USING "btree" ("block_time");
CREATE INDEX "send_earn_create_send_earn" ON "public"."send_earn_create" USING "btree" ("send_earn");
CREATE INDEX "send_earn_deposit_block_num" ON "public"."send_earn_deposit" USING "btree" ("block_num");
CREATE INDEX "send_earn_deposit_block_time" ON "public"."send_earn_deposit" USING "btree" ("block_time");
CREATE INDEX idx_earn_deposit_owner_blocktime ON "public"."send_earn_deposit" USING "btree" ("owner", "block_time" DESC);
CREATE INDEX idx_earn_withdraw_owner_blocktime ON "public"."send_earn_withdraw" USING "btree" ("owner", "block_time" DESC);
CREATE INDEX "send_earn_deposit_owner_idx" ON "public"."send_earn_deposit" USING "btree" ("owner", "log_addr");
CREATE INDEX "send_earn_new_affiliate_affiliate_idx" ON "public"."send_earn_new_affiliate" USING "btree" ("affiliate");
CREATE INDEX "send_earn_new_affiliate_block_num" ON "public"."send_earn_new_affiliate" USING "btree" ("block_num");
CREATE INDEX "send_earn_new_affiliate_block_time" ON "public"."send_earn_new_affiliate" USING "btree" ("block_time");
CREATE INDEX "send_earn_new_affiliate_send_earn_affiliate_idx" ON "public"."send_earn_new_affiliate" USING "btree" ("send_earn_affiliate");
CREATE INDEX "send_earn_withdraw_block_num" ON "public"."send_earn_withdraw" USING "btree" ("block_num");
CREATE INDEX "send_earn_withdraw_block_time" ON "public"."send_earn_withdraw" USING "btree" ("block_time");
CREATE INDEX "send_earn_withdraw_owner_idx" ON "public"."send_earn_withdraw" USING "btree" ("owner", "log_addr");
CREATE INDEX "idx_earn_deposit_owner_logaddr_blocknum" ON "public"."send_earn_deposit" USING "btree" ("owner", "log_addr", "block_num");
CREATE INDEX "idx_earn_withdraw_owner_logaddr_blocknum" ON "public"."send_earn_withdraw" USING "btree" ("owner", "log_addr", "block_num");
CREATE UNIQUE INDEX "u_send_earn_create" ON "public"."send_earn_create" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE UNIQUE INDEX "u_send_earn_deposit" ON "public"."send_earn_deposit" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE UNIQUE INDEX "u_send_earn_new_affiliate" ON "public"."send_earn_new_affiliate" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE UNIQUE INDEX "u_send_earn_withdraw" ON "public"."send_earn_withdraw" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Triggers
CREATE OR REPLACE TRIGGER "aaa_filter_send_earn_deposit_with_no_send_account_created" BEFORE INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."aaa_filter_send_earn_deposit_with_no_send_account_created"();
CREATE OR REPLACE TRIGGER "aaa_filter_send_earn_withdraw_with_no_send_account_created" BEFORE INSERT ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_earn_withdraw_with_no_send_account_created"();
CREATE OR REPLACE TRIGGER "aaa_send_earn_deposit_trigger_delete_activity" AFTER DELETE ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_deposit_trigger_delete_activity"();
CREATE OR REPLACE TRIGGER "aaa_send_earn_withdraw_trigger_delete_activity" AFTER DELETE ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_withdraw_trigger_delete_activity"();
CREATE OR REPLACE TRIGGER "aab_send_earn_deposit_trigger_insert_activity" AFTER INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_deposit_trigger_insert_activity"();
CREATE OR REPLACE TRIGGER "aab_send_earn_withdraw_trigger_insert_activity" AFTER INSERT ON "public"."send_earn_withdraw" FOR EACH ROW EXECUTE FUNCTION "private"."send_earn_withdraw_trigger_insert_activity"();
CREATE OR REPLACE TRIGGER "aac_insert_referral_on_deposit" AFTER INSERT ON "public"."send_earn_deposit" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_deposit"();
CREATE OR REPLACE TRIGGER "insert_referral_on_create" AFTER INSERT ON "public"."send_earn_create" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_create"();
CREATE OR REPLACE TRIGGER "insert_referral_on_new_affiliate" AFTER INSERT ON "public"."send_earn_new_affiliate" FOR EACH ROW EXECUTE FUNCTION "private"."insert_referral_on_new_affiliate"();

-- RLS
ALTER TABLE "public"."send_earn_create" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."send_earn_deposit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."send_earn_new_affiliate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."send_earn_withdraw" ENABLE ROW LEVEL SECURITY;


-- Policies
CREATE POLICY "send_earn_create viewable by authenticated users" ON "public"."send_earn_create" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "send_earn_new_affiliate viewable by authenticated users" ON "public"."send_earn_new_affiliate" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "users can see their own send_earn_deposit" ON "public"."send_earn_deposit" FOR SELECT USING (("owner" = ANY ( SELECT "send_accounts"."address_bytes"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));
CREATE POLICY "users can see their own send_earn_withdraw" ON "public"."send_earn_withdraw" FOR SELECT USING (("owner" = ANY ( SELECT "send_accounts"."address_bytes"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));

-- Grants
GRANT ALL ON TABLE "public"."send_earn_create" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_create" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_create" TO "service_role";

GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "anon";
GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "authenticated";
GRANT ALL ON TABLE "public"."send_earn_new_affiliate" TO "service_role";

GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "anon";
GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_earn_affiliate_vault"("public"."send_earn_new_affiliate") TO "service_role";

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

REVOKE ALL ON "public"."send_earn_balances_timeline" FROM PUBLIC;
REVOKE ALL ON "public"."send_earn_balances_timeline" FROM anon;
GRANT ALL ON "public"."send_earn_balances_timeline" TO authenticated;
GRANT ALL ON "public"."send_earn_balances_timeline" TO service_role;