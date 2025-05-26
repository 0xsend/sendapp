-- Functions
CREATE OR REPLACE FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = OLD.workflow_id;
    RETURN OLD;
END;
$$;
ALTER FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    note_text text;
    activity_sender_user_id uuid;
    activity_receiver_user_id uuid;
BEGIN
    -- Only proceed if status is changing to 'confirmed' and data has a note
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.data ? 'note' THEN
        note_text := NEW.data->>'note';
        
        -- Only proceed if note is not empty
        IF note_text IS NOT NULL AND length(trim(note_text)) > 0 THEN
            -- Get sender and receiver user IDs from the activity table
            SELECT from_user_id, to_user_id INTO activity_sender_user_id, activity_receiver_user_id
            FROM activity
            WHERE event_id = NEW.send_account_transfers_activity_event_id
            AND event_name = 'temporal_send_account_transfers';
            
            -- Insert note activity with the same timestamp as the transfer
            INSERT INTO activity (
                event_name,
                event_id,
                from_user_id,
                to_user_id,
                data,
                created_at
            )
            VALUES (
                'temporal_send_account_transfers_note',
                NEW.send_account_transfers_activity_event_id || '/note',
                activity_sender_user_id,
                activity_receiver_user_id,
                jsonb_build_object(
                    'note', note_text,
                    'transfer_event_id', NEW.send_account_transfers_activity_event_id
                ),
                (SELECT created_at FROM activity WHERE event_id = NEW.send_account_transfers_activity_event_id AND event_name = 'temporal_send_account_transfers')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;
ALTER FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "temporal"."send_account_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "temporal"."send_account_transfers_id_seq" OWNER TO "postgres";

-- Tables
CREATE TABLE IF NOT EXISTS "temporal"."send_account_transfers" (
    "id" integer NOT NULL,
    "workflow_id" "text" NOT NULL,
    "status" "temporal"."transfer_status" DEFAULT 'initialized'::"temporal"."transfer_status" NOT NULL,
    "user_id" "uuid",
    "created_at_block_num" numeric,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "send_account_transfers_activity_event_id" "text",
    "send_account_transfers_activity_event_name" "text"
);
ALTER TABLE "temporal"."send_account_transfers" OWNER TO "postgres";

-- Note: temporal.send_earn_deposits table appears to be defined elsewhere (possibly in send_earn.sql or migrations)
-- Only the primary key constraint is defined here
CREATE TABLE IF NOT EXISTS "temporal"."send_earn_deposits" (
    "workflow_id" "text" NOT NULL
    -- Other columns defined in send_earn.sql or migrations
);

-- Sequence ownership and defaults
ALTER SEQUENCE "temporal"."send_account_transfers_id_seq" OWNED BY "temporal"."send_account_transfers"."id";
ALTER TABLE ONLY "temporal"."send_account_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"temporal"."send_account_transfers_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "temporal"."send_account_transfers"
    ADD CONSTRAINT "send_account_transfers_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "temporal"."send_earn_deposits"
    ADD CONSTRAINT "send_earn_deposits_pkey" PRIMARY KEY ("workflow_id");

-- Indexes
CREATE INDEX "send_account_transfers_status_created_at_block_num_idx" ON "temporal"."send_account_transfers" USING "btree" ("status", "created_at_block_num" DESC);
CREATE INDEX "send_account_transfers_user_id_workflow_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("user_id", "workflow_id");
CREATE INDEX "send_account_transfers_workflow_id_created_at_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id", "created_at" DESC);
CREATE INDEX "send_account_transfers_workflow_id_updated_at_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id", "updated_at" DESC);
CREATE INDEX "temporal_send_account_transfers_activity_event_name_event_id_id" ON "temporal"."send_account_transfers" USING "btree" ("send_account_transfers_activity_event_id", "send_account_transfers_activity_event_name");
CREATE INDEX "temporal_send_account_transfers_user_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("user_id");
CREATE UNIQUE INDEX "temporal_send_account_transfers_workflow_id_idx" ON "temporal"."send_account_transfers" USING "btree" ("workflow_id");

-- Triggers
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_add_note_activity_temporal_trans" BEFORE UPDATE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"();