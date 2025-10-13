-- Send Account Transfers
-- This table tracks transfers between send accounts on the blockchain

-- Cleanup legacy racey triggers (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'send_account_transfers_trigger_delete_temporal_activity'
  ) THEN
    DROP TRIGGER "send_account_transfers_trigger_delete_temporal_activity" ON "public"."send_account_transfers";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'send_account_transfers_delete_temporal_activity'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION IF EXISTS "public"."send_account_transfers_delete_temporal_activity"();
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'send_account_transfers_trigger_insert_activity'
  ) THEN
    DROP TRIGGER "send_account_transfers_trigger_insert_activity" ON "public"."send_account_transfers";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'send_account_transfers_trigger_insert_activity'
      AND pg_function_is_visible(oid)
  ) THEN
    DROP FUNCTION IF EXISTS "public"."send_account_transfers_trigger_insert_activity"();
  END IF;
END
$$;

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

-- RLS
ALTER TABLE "public"."send_account_transfers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own transfers" ON "public"."send_account_transfers" FOR SELECT USING (((("lower"("concat"('0x', "encode"("f", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (("lower"("concat"('0x', "encode"("t", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

-- Grants
