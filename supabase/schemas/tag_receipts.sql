-- Functions
CREATE OR REPLACE FUNCTION "public"."tag_receipts_insert_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    delete from activity
    where event_name = 'tag_receipt_usdc'
      and event_id in (select event_id from NEW_TABLE);

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        t.user_id,
        null,
        json_build_object(
                'log_addr',
                scr.log_addr,
                'block_num',
                scr.block_num,
                'tx_idx',
                scr.tx_idx,
                'log_idx',
                scr.log_idx,
                'tx_hash',
                scr.tx_hash,
                'tags',
                array_agg(t.name),
                'value',
            -- cast amount to text to avoid losing precision when converting to json when sending to clients
                scr.amount::text
        ),
        current_timestamp
    from NEW_TABLE
             join tags t on t.name = NEW_TABLE.tag_name
             join sendtag_checkout_receipts scr ON NEW_TABLE.event_id = scr.event_id
    group by t.user_id, NEW_TABLE.event_id, scr.event_id, scr.log_addr, scr.block_num, scr.tx_idx, scr.log_idx,  scr.tx_hash, scr.amount;

    return NULL;
end;
$$;
ALTER FUNCTION "public"."tag_receipts_insert_activity_trigger"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."tag_receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."tag_receipts_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."tag_receipts" (
    "tag_name" "public"."citext" NOT NULL,
    "hash" "public"."citext",
    "event_id" "text",
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."tag_receipts" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."tag_receipts_id_seq" OWNED BY "public"."tag_receipts"."id";
ALTER TABLE ONLY "public"."tag_receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tag_receipts_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE UNIQUE INDEX "tag_receipts_event_id_idx" ON "public"."tag_receipts" USING "btree" ("tag_name", "event_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_tag_name_fkey" FOREIGN KEY ("tag_name") REFERENCES "public"."tags"("name") ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "tag_receipts_insert_activity_trigger" AFTER INSERT ON "public"."tag_receipts" REFERENCING NEW TABLE AS "new_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."tag_receipts_insert_activity_trigger"();

-- Grants
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "service_role";

GRANT ALL ON TABLE "public"."tag_receipts" TO "anon";
GRANT ALL ON TABLE "public"."tag_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_receipts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "service_role";