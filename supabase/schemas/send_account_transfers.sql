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

-- Delete temporal activity function
CREATE OR REPLACE FUNCTION public.send_account_transfers_delete_temporal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    ignored_addresses bytea[] := ARRAY['\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, '\x36f43082d01df4801af2d95aeed1a0200c5510ae'::bytea];
begin
    -- Check if it's from or to any ignored address (e.g., paymaster)
    if (NEW.f is not null and NEW.f = ANY (ignored_addresses)) or
       (NEW.t is not null and NEW.t = ANY (ignored_addresses)) then
        return NEW;
    end if;
    
    -- Delete pending temporal activities by activity_id (direct FK reference)
    -- Match the specific temporal transfer by user_op_hash or addresses+value
    delete from public.activity
    where id IN (
        SELECT activity_id
        FROM temporal.send_account_transfers
        WHERE activity_id IS NOT NULL
          AND created_at_block_num <= NEW.block_num
          AND status IN ('initialized', 'submitted', 'sent')
          AND (
            -- Match by user_op_hash (most reliable - exact tx match)
            (data ? 'user_op_hash' AND (data->>'user_op_hash')::bytea = NEW.tx_hash)
            OR
            -- Fallback: match by addresses + value (for cases without user_op_hash)
            (
              (
                (data ? 'f' AND (data->>'f')::bytea = NEW.f) 
                OR 
                (data ? 'sender' AND (data->>'sender')::bytea = NEW.f)
              )
              AND
              (
                (data ? 't' AND (data->>'t')::bytea = NEW.t)
                OR
                (data ? 'log_addr' AND (data->>'log_addr')::bytea = NEW.t)
              )
              AND
              (
                (data ? 'v' AND (data->>'v')::numeric = NEW.v)
                OR
                (data ? 'value' AND (data->>'value')::numeric = NEW.v)
              )
            )
          )
    );
    
    return NEW;
end;
$function$
;
ALTER FUNCTION "public"."send_account_transfers_delete_temporal_activity"() OWNER TO "postgres";

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
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_temporal_activity" BEFORE INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_delete_temporal_activity"();
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
