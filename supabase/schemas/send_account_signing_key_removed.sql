-- Functions
CREATE OR REPLACE FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity where event_id = OLD.event_id and event_name = 'send_account_signing_key_removed';
    return OLD;
end;
$$;
ALTER FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.send_account_signing_key_removed_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr',
        NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key', json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_removed
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_removed',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
                                                     to_user_id   = null,
                                                     data         = _data,
                                                     created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;
ALTER FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_account_signing_key_removed_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_account_signing_key_removed_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_account_signing_key_removed" (
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "account" "bytea" NOT NULL,
    "key_slot" smallint NOT NULL,
    "key" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "id" integer NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::text) || "src_name") || '/'::text) || ("block_num")::text) || '/'::text) || ("tx_idx")::text) || '/'::text) || ("log_idx")::text)) STORED NOT NULL
);
ALTER TABLE "public"."send_account_signing_key_removed" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_account_signing_key_removed_id_seq" OWNED BY "public"."send_account_signing_key_removed"."id";
ALTER TABLE ONLY "public"."send_account_signing_key_removed" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_account_signing_key_removed_id_seq"'::regclass);

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_account_signing_key_removed"
    ADD CONSTRAINT "send_account_signing_key_removed_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_account_signing_key_removed_block_num" ON "public"."send_account_signing_key_removed" USING "btree" ("block_num");
CREATE INDEX "send_account_signing_key_removed_block_time" ON "public"."send_account_signing_key_removed" USING "btree" ("block_time");
CREATE UNIQUE INDEX "u_send_account_signing_key_removed" ON "public"."send_account_signing_key_removed" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");

-- Triggers
CREATE OR REPLACE TRIGGER "send_account_signing_key_removed_trigger_delete_activity" AFTER DELETE ON "public"."send_account_signing_key_removed" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"();
CREATE OR REPLACE TRIGGER "send_account_signing_key_removed_trigger_insert_activity" AFTER INSERT ON "public"."send_account_signing_key_removed" FOR EACH ROW EXECUTE FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"();

-- RLS
ALTER TABLE "public"."send_account_signing_key_removed" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see own signing key removed" ON "public"."send_account_signing_key_removed" FOR SELECT USING ((("lower"("concat"('0x', "encode"("account", 'hex'::text))))::citext OPERATOR(=) ANY ( SELECT "send_accounts"."address"
   FROM "public"."send_accounts"
  WHERE ("send_accounts"."user_id" = ( SELECT "auth"."uid"() AS "uid")))));

-- Grants
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_delete_activity"() TO "service_role";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_account_signing_key_removed_trigger_insert_activity"() TO "service_role";
GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "anon";
GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_signing_key_removed" TO "service_role";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_signing_key_removed_id_seq" TO "service_role";
