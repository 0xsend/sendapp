-- Send Account Transfers
-- This table tracks transfers between send accounts on the blockchain

-- Functions

-- Filter function to ensure transfers only include existing send accounts
CREATE OR REPLACE FUNCTION private.filter_send_account_transfers_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;
ALTER FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"() OWNER TO "postgres";

-- Delete temporal activity function
CREATE OR REPLACE FUNCTION "public"."send_account_transfers_delete_temporal_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    paymaster bytea = '\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea;
    workflow_ids text[];
begin
    -- Check if it's from or to paymaster
    if (NEW.f is not null and NEW.f = paymaster) or
       (NEW.t is not null and NEW.t = paymaster) then
        return NEW;
    end if;
    -- Only proceed with deletions if we have workflow IDs
    delete from public.activity a
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id in (select t_sat.workflow_id
                         from temporal.send_account_transfers t_sat
                         where t_sat.created_at_block_num <= NEW.block_num
                           and t_sat.status != 'failed');
    return NEW;
end;
$$;
ALTER FUNCTION "public"."send_account_transfers_delete_temporal_activity"() OWNER TO "postgres";

-- Activity trigger functions
CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_delete_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM activity
    WHERE event_id = CONCAT(old.ig_name, '/', old.src_name, '/', old.block_num, '/', old.tx_idx, '/', old.log_idx)
        and event_name = 'send_account_transfers';
    RETURN OLD;
END;
$function$
;

ALTER FUNCTION "public"."send_account_transfers_trigger_delete_activity"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    from_user_id uuid;
    to_user_id uuid;
    new_created_at timestamp with time zone;
BEGIN
    SELECT user_id INTO from_user_id FROM send_accounts WHERE address = concat('0x', encode(new.f, 'hex'))::citext;
    SELECT user_id INTO to_user_id FROM send_accounts WHERE address = concat('0x', encode(new.t, 'hex'))::citext;
    -- use created_at if tags has confirmed_at, otherwise use block timestamp
    new_created_at = to_timestamp(new.block_time);
    -- both send accounts have user_id
    IF from_user_id IS NOT NULL AND to_user_id IS NOT NULL THEN
        -- insert activity for both
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES
            ('send_account_transfers', new.event_id, from_user_id, to_user_id, to_jsonb(new), new_created_at),
            ('send_account_transfers', new.event_id, to_user_id, from_user_id, to_jsonb(new), new_created_at);
    ELSIF from_user_id IS NOT NULL THEN
        -- insert for send
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES ('send_account_transfers', new.event_id, from_user_id, NULL, to_jsonb(new), new_created_at);
    ELSIF to_user_id IS NOT NULL THEN
        -- insert for receive
        INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
        VALUES ('send_account_transfers', new.event_id, NULL, to_user_id, to_jsonb(new), new_created_at);
    END IF;
    RETURN NEW;
END;
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
CREATE OR REPLACE TRIGGER "insert_verification_sends" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_activity" AFTER DELETE ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_delete_activity"();
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_delete_temporal_activity" BEFORE INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_delete_temporal_activity"();
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_insert_activity" AFTER INSERT ON "public"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_transfers_trigger_insert_activity"();

-- RLS
ALTER TABLE "public"."send_account_transfers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can see their own transfers" ON "public"."send_account_transfers" FOR SELECT USING (((("lower"("concat"('0x', "encode"("f", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))) OR (("lower"("concat"('0x', "encode"("t", 'hex'::"text"))))::"public"."citext" OPERATOR("public".=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))));

-- Grants
REVOKE ALL ON FUNCTION "private"."filter_send_account_transfers_with_no_send_account_created"() FROM PUBLIC;

GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_delete_temporal_activity"() TO "service_role";

GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_delete_activity"() TO "service_role";

GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_transfers_trigger_insert_activity"() TO "service_role";

GRANT ALL ON TABLE "public"."send_account_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_account_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_transfers" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_transfers_id_seq" TO "service_role";
