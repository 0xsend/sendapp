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

CREATE OR REPLACE FUNCTION "temporal"."temporal_transfer_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  _user_id uuid;
  _address text;
BEGIN
  IF NEW.data ? 'f' THEN
    _address := concat('0x', encode((NEW.data->>'f')::bytea, 'hex'));
  ELSIF NEW.data ? 'sender' THEN
    _address := concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'));
  ELSE
    RAISE NOTICE E'No sender address. workflow_id: %\n', NEW.workflow_id;
    RETURN NEW;
  END IF;

  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address = _address::citext;

  IF _user_id IS NULL THEN
    RAISE NOTICE E'No user found for address: %, workflow_id: %\n', _address, NEW.workflow_id;
    RETURN NEW;
  END IF;

  NEW.user_id = _user_id;

  RETURN NEW;
END;
$$;
ALTER FUNCTION "temporal"."temporal_transfer_before_insert"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION temporal.add_note_activity_temporal_transfer_before_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status != 'confirmed' OR NOT (NEW.data ? 'note') THEN
      RETURN NEW;
  END IF;


  UPDATE public.activity
  SET data = data || jsonb_build_object('note', NEW.data->>'note')
  WHERE event_name = NEW.data->>'event_name'
  AND event_id = NEW.data->>'event_id';

  RETURN NEW;
END;
$function$
;
ALTER FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  inserted_activity_id BIGINT;
  owner_user_id UUID;
  activity_data jsonb;
BEGIN
  -- Only attempt to find user_id if owner is provided
  IF NEW.owner IS NULL THEN
    -- Skip activity creation if no owner is available yet
    -- The workflow will update the record with owner later
    RETURN NULL;
  END IF;

  -- Attempt to find the user_id based on the owner address
  -- Requires SELECT permission on public.send_accounts for the function executor (service_role or postgres)
  SELECT user_id INTO owner_user_id
  FROM public.send_accounts
  WHERE address = concat('0x', encode(NEW.owner, 'hex'))::citext
  LIMIT 1;

  IF owner_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build data object with only available fields
  activity_data := jsonb_build_object('workflow_id', NEW.workflow_id);

  -- Add fields if they're not null
  IF NEW.owner IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('owner', NEW.owner);
  END IF;

  IF NEW.assets IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('assets', NEW.assets::text);
  END IF;

  IF NEW.vault IS NOT NULL THEN
    activity_data := activity_data || jsonb_build_object('vault', NEW.vault);
  END IF;

  -- Insert into public.activity
  INSERT INTO public.activity (event_name, event_id, data, from_user_id)
  VALUES (
    'temporal_send_earn_deposit',
    NEW.workflow_id,
    activity_data,
    owner_user_id
  )
  RETURNING id INTO inserted_activity_id;

  -- Update the temporal.send_earn_deposits row with the new activity_id
  UPDATE temporal.send_earn_deposits
  SET activity_id = inserted_activity_id
  WHERE workflow_id = NEW.workflow_id;

  RETURN NULL; -- AFTER triggers should return NULL
END;
$$;
ALTER FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_data jsonb;
BEGIN
  -- Check if status actually changed and if activity_id exists
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.activity_id IS NOT NULL THEN

    -- If the new status is 'failed'
    IF NEW.status = 'failed' THEN
      -- Prepare the updated data JSONB
      -- Start with existing data and add/overwrite status and error
      -- Ensure we handle potential NULL existing data gracefully
      SELECT COALESCE(a.data, '{}'::jsonb) || jsonb_build_object(
                          'status', 'failed',
                          'error_message', NEW.error_message
                      )
      INTO updated_data
      FROM public.activity a
      WHERE a.id = NEW.activity_id;

      -- Update the corresponding activity record only if it was found
      IF FOUND THEN
          UPDATE public.activity
          SET
            event_name = 'temporal_send_earn_deposit',
            data = updated_data,
            -- Use the timestamp from the temporal table update
            created_at = NEW.updated_at -- Reflects the failure time
          WHERE id = NEW.activity_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW; -- Result is ignored for AFTER triggers, but required syntax
END;
$$;
ALTER FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() OWNER TO "postgres";

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

CREATE TABLE IF NOT EXISTS "temporal"."send_earn_deposits" (
    "workflow_id" "text" NOT NULL,
    "status" "public"."temporal_status" DEFAULT 'initialized'::"public"."temporal_status" NOT NULL,
    "owner" "bytea",
    "assets" numeric,
    "vault" "bytea",
    "user_op_hash" "bytea",
    "block_num" numeric,
    "activity_id" bigint,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
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

-- Add missing indexes for send_earn_deposits
CREATE INDEX "idx_temporal_send_earn_deposits_activity_id" ON "temporal"."send_earn_deposits" USING "btree" ("activity_id");
CREATE INDEX "idx_temporal_send_earn_deposits_created_at" ON "temporal"."send_earn_deposits" USING "btree" ("created_at");
CREATE INDEX "idx_temporal_send_earn_deposits_status_owner_block_num" ON "temporal"."send_earn_deposits" USING "btree" ("status", "owner", "block_num");

-- Foreign Keys
-- Add foreign key constraint to public.activity
ALTER TABLE temporal.send_earn_deposits
ADD CONSTRAINT fk_activity
FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE "temporal"."send_account_transfers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can see their own temporal transfers" ON "temporal"."send_account_transfers" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));

-- Functions
CREATE OR REPLACE FUNCTION "temporal"."temporal_transfer_after_upsert"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _to_user_id uuid;
  _data jsonb;
BEGIN
    -- Do nothing if we haven't sent the transfer yet
    IF NEW.status = 'initialized' THEN
        RETURN NEW;
    END IF;

    -- Update send_account_transfers activity with note
    IF NEW.status = 'confirmed' THEN
        IF EXISTS (
            SELECT 1 FROM public.activity a
            WHERE event_name = NEW.send_account_transfers_activity_event_name
            AND event_id = NEW.send_account_transfers_activity_event_id
        ) THEN
            IF NEW.data ? 'note' THEN
                UPDATE public.activity a
                SET data = a.data || jsonb_build_object('note', NEW.data->>'note')
                WHERE event_name = NEW.send_account_transfers_activity_event_name
                AND event_id = NEW.send_account_transfers_activity_event_id;
            END IF;

            DELETE FROM public.activity
            WHERE event_id = NEW.workflow_id
            AND event_name = 'temporal_send_account_transfers';

            RETURN NEW;
        END IF;
    END IF;

    -- Do nothing if we have already indexed the transfer and its not failed
    IF NEW.status != 'failed' AND NEW.created_at_block_num <= (
        SELECT block_num
        FROM public.send_account_transfers
        ORDER BY block_num DESC
        LIMIT 1
    ) THEN
        RETURN NEW;
    END IF;

    -- token transfers
    IF NEW.data ? 't' THEN
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'f', NEW.data->>'f',
            't', NEW.data->>'t',
            'v', NEW.data->>'v',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    -- eth transfers
    ELSE
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'sender', NEW.data->>'sender',
            'value', NEW.data->>'value',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    END IF;

    _data := jsonb_strip_nulls(_data);

    INSERT INTO activity(
        event_name,
        event_id,
        from_user_id,
        to_user_id,
        data
    )
    VALUES (
        'temporal_send_account_transfers',
        NEW.workflow_id,
        NEW.user_id,
        _to_user_id,
        _data
    )
    ON CONFLICT (event_name, event_id)
    DO UPDATE SET
        data = EXCLUDED.data;
    RETURN NEW;
END;
$$;

-- Triggers
CREATE OR REPLACE TRIGGER "send_account_transfers_trigger_add_note_activity_temporal_trans" BEFORE UPDATE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"();

CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_after_upsert" AFTER INSERT OR UPDATE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_transfer_after_upsert"();

CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_before_insert" BEFORE INSERT ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_transfer_before_insert"();

CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_delete_activity" BEFORE DELETE ON "temporal"."send_account_transfers" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"();

CREATE OR REPLACE TRIGGER "aaa_temporal_deposit_insert_pending_activity" AFTER INSERT ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_deposit_insert_pending_activity"();

CREATE OR REPLACE TRIGGER "aab_temporal_deposit_update_activity_on_status_change" AFTER UPDATE ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"();

CREATE OR REPLACE TRIGGER "set_temporal_send_earn_deposits_updated_at" BEFORE UPDATE ON "temporal"."send_earn_deposits" FOR EACH ROW EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

-- Grants
REVOKE ALL ON FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_deposit_insert_pending_activity"() TO "service_role";

REVOKE ALL ON FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_deposit_update_activity_on_status_change"() TO "service_role";

REVOKE ALL ON FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_send_account_transfers_trigger_delete_activity"() TO "service_role";

GRANT ALL ON FUNCTION "temporal"."add_note_activity_temporal_transfer_before_confirmed"() TO "service_role";

