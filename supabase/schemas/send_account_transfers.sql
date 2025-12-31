-- Send Account Transfers
-- This table tracks transfers between send accounts on the blockchain

-- Functions

-- Filter function to ensure transfers only include existing send accounts
-- create trigger function for filtering send_account_transfers with no send_account_created
-- Deletes send_account_transfers with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_account_transfers with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_account_transfers with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
create or replace function private.filter_send_account_transfers_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
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

-- Deterministic Reconciliation Trigger Function
-- 
-- This function implements deterministic reconciliation by linking transfer_intents
-- to on-chain events using exact keys (tx_hash, user_op_hash).
-- It replaces the old fuzzy matching approach that could cause cross-linking.
--
-- Key properties:
-- - Uses exact tx_hash or user_op_hash matching (no fuzzy fallback)
-- - Creates transfer_reconciliations record with (chain_id, tx_hash, log_idx) unique key
-- - Propagates notes from intents to indexed activities
-- - Cleans up temporal activities deterministically
--
CREATE OR REPLACE FUNCTION public.reconcile_transfer_on_index()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $function$
DECLARE
    _intent_id bigint;
    _intent_note text;
    _intent_workflow_id text;
    _event_id text;
BEGIN
    -- Build the event_id to reference the indexed event
    _event_id := NEW.ig_name || '/' || NEW.src_name || '/' || NEW.block_num::text || '/' || NEW.tx_idx::text || '/' || NEW.log_idx::text;
    
    -- Strategy 1: Match by tx_hash (exact transaction match)
    -- This works when the transfer_intent has the tx_hash set after submission
    SELECT id, note, workflow_id INTO _intent_id, _intent_note, _intent_workflow_id
    FROM public.transfer_intents
    WHERE tx_hash = NEW.tx_hash
      AND status IN ('pending', 'submitted')
      AND chain_id = NEW.chain_id
    LIMIT 1;
    
    -- Strategy 2: Match by user_op_hash if tx_hash match fails
    -- For 4337 transactions, the user_op_hash is stored in the intent
    -- and the tx_hash is actually the user_op_hash
    IF _intent_id IS NULL THEN
        SELECT id, note, workflow_id INTO _intent_id, _intent_note, _intent_workflow_id
        FROM public.transfer_intents
        WHERE user_op_hash = NEW.tx_hash
          AND status IN ('pending', 'submitted')
          AND chain_id = NEW.chain_id
        LIMIT 1;
    END IF;
    
    -- If we found a matching intent, create the reconciliation
    IF _intent_id IS NOT NULL THEN
        -- Insert the reconciliation record (deterministic link)
        -- The UNIQUE constraint on (chain_id, tx_hash, log_idx) ensures collision invariants
        INSERT INTO public.transfer_reconciliations (
            intent_id,
            chain_id,
            tx_hash,
            log_idx,
            block_num,
            block_time,
            event_id
        ) VALUES (
            _intent_id,
            NEW.chain_id,
            NEW.tx_hash,
            NEW.log_idx,
            NEW.block_num,
            NEW.block_time,
            _event_id
        )
        ON CONFLICT (chain_id, tx_hash, log_idx) DO NOTHING;
        
        -- Update the intent status to confirmed
        UPDATE public.transfer_intents
        SET status = 'confirmed'
        WHERE id = _intent_id;
        
        -- If the intent had a note, propagate it to the indexed activity
        IF _intent_note IS NOT NULL THEN
            UPDATE public.activity
            SET data = data || jsonb_build_object('note', _intent_note)
            WHERE event_name = 'send_account_transfers'
              AND event_id = _event_id;
        END IF;
        
        -- Delete the pending temporal activity if it exists
        -- (cleanup the old temporal activity row)
        IF _intent_workflow_id IS NOT NULL THEN
            DELETE FROM public.activity
            WHERE event_name = 'temporal_send_account_transfers'
              AND event_id = _intent_workflow_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."reconcile_transfer_on_index"() OWNER TO "postgres";

-- Activity trigger functions
CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_delete_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    delete
    from activity
    where event_id = OLD.event_id
        and event_name = 'send_account_transfers';
    return OLD;
end;
$function$
;

ALTER FUNCTION "public"."send_account_transfers_trigger_delete_activity"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
begin
    select user_id into _f_user_id
    from send_accounts
    where address_bytes = NEW.f
      and chain_id = NEW.chain_id::integer
    limit 1;
    select user_id into _t_user_id
    from send_accounts
    where address_bytes = NEW.t
      and chain_id = NEW.chain_id::integer
    limit 1;

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
$function$
;

ALTER FUNCTION "public"."send_account_transfers_trigger_insert_activity"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_account_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_account_transfers_id_seq" OWNER TO "postgres";

-- Table
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

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_account_transfers_id_seq" OWNED BY "public"."send_account_transfers"."id";
ALTER TABLE ONLY "public"."send_account_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_transfers_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_account_transfers"
    ADD CONSTRAINT "send_account_transfers_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_send_account_transfers_f_t_block_time" ON "public"."send_account_transfers" USING "btree" ("f", "t", "block_time");
CREATE INDEX "send_account_transfers_block_num" ON "public"."send_account_transfers" USING "btree" ("block_num");
CREATE INDEX "send_account_transfers_block_time" ON "public"."send_account_transfers" USING "btree" ("block_time");
CREATE INDEX "send_account_transfers_f" ON "public"."send_account_transfers" USING "btree" ("f");
CREATE INDEX "send_account_transfers_t" ON "public"."send_account_transfers" USING "btree" ("t");
CREATE UNIQUE INDEX "u_send_account_transfers" ON "public"."send_account_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Foreign Keys
-- None for this table

-- Triggers
CREATE OR REPLACE TRIGGER "filter_send_account_transfers_with_no_send_account_created" BEFORE INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"();
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_activity" AFTER DELETE ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_delete_activity"();
-- Note: send_account_transfers_trigger_delete_temporal_activity removed - replaced by deterministic reconciliation
CREATE OR REPLACE TRIGGER "send_account_transfers_reconcile_on_index" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."reconcile_transfer_on_index"();
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_insert_activity" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_insert_activity"();

-- RLS
ALTER TABLE "public"."send_account_transfers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own transfers" ON "public"."send_account_transfers" FOR SELECT USING ((
  EXISTS (
    SELECT 1 FROM "public"."send_accounts"
    WHERE "send_accounts"."user_id" = (SELECT auth.uid())
      AND "send_accounts"."address_bytes" = "send_account_transfers"."f"
  )
  OR
  EXISTS (
    SELECT 1 FROM "public"."send_accounts"
    WHERE "send_accounts"."user_id" = (SELECT auth.uid())
      AND "send_accounts"."address_bytes" = "send_account_transfers"."t"
  )
));

-- Grants
