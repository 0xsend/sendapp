-- this table exists to catch values from our backfill integrations defined in /packages/shovel/src/backfill/config.ts
-- It is used as a catch all for any integration table. It uses ig_name and src_name to identify which table the backfill belongs to.
-- Unique event colunns are kept in a data column

CREATE SEQUENCE IF NOT EXISTS "public"."shovel_backfill_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."shovel_backfill_id_seq" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."shovel_backfill" (
    "id" integer NOT NULL,
    "chain_id" numeric NOT NULL,
    "log_addr" "bytea" NOT NULL,
    "block_time" numeric NOT NULL,
    "tx_hash" "bytea" NOT NULL,
    "ig_name" "text" NOT NULL,
    "src_name" "text" NOT NULL,
    "block_num" numeric NOT NULL,
    "tx_idx" integer NOT NULL,
    "log_idx" integer NOT NULL,
    "abi_idx" smallint NOT NULL,
    "data" jsonb NOT NULL,
    "event_id" "text" GENERATED ALWAYS AS ((((((((("ig_name" || '/'::"text") || "src_name") || '/'::"text") || ("block_num")::"text") || '/'::"text") || ("tx_idx")::"text") || '/'::"text") || ("log_idx")::"text")) STORED NOT NULL
);
ALTER TABLE "public"."shovel_backfill" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."shovel_backfill_id_seq" OWNED BY "public"."shovel_backfill"."id";
ALTER TABLE ONLY "public"."shovel_backfill" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."shovel_backfill_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."shovel_backfill"
    ADD CONSTRAINT "shovel_backfill_pkey" PRIMARY KEY ("id");

-- Function to validate ig_name ends with "_backfill" and corresponding table exists
CREATE OR REPLACE FUNCTION "public"."shovel_backfill_validate_ig_name"("ig_name" "text")
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    target_table_name text;
    table_exists boolean;
BEGIN
    -- Check that ig_name ends with "_backfill"
    IF NOT ("ig_name" LIKE '%\_backfill') THEN
        RETURN false;
    END IF;

    -- Extract table name by removing "_backfill" suffix
    target_table_name := replace("ig_name", '_backfill', '');

    -- Check if the table exists in public schema
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND "information_schema"."tables"."table_name" = target_table_name
    ) INTO table_exists;

    RETURN table_exists;
END;
$$;

ALTER FUNCTION "public"."shovel_backfill_validate_ig_name"("text") OWNER TO "postgres";

-- Constraint to ensure ig_name is valid
ALTER TABLE ONLY "public"."shovel_backfill"
    ADD CONSTRAINT "shovel_backfill_ig_name_valid" CHECK ("public"."shovel_backfill_validate_ig_name"("ig_name"));

CREATE OR REPLACE FUNCTION "public"."shovel_backfill_before_insert"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_ig_name text;
BEGIN
    target_ig_name := replace(NEW.ig_name, '_backfill', '');
    -- Check if a row with the same unique index fields already exists in the target table
    -- Unique index: (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx)
    CASE NEW.ig_name
        WHEN 'send_account_transfers_backfill' THEN
            IF EXISTS (
                SELECT 1 FROM "public"."send_account_transfers"
                WHERE ig_name = target_ig_name
                  AND src_name = NEW.src_name
                  AND block_num = NEW.block_num
                  AND tx_idx = NEW.tx_idx
                  AND log_idx = NEW.log_idx
                  AND abi_idx = NEW.abi_idx
            ) THEN
                -- Return NULL to cancel the insert
                RETURN NULL;
            END IF;
            NEW.data = jsonb_build_object(
                'f', NEW.f,
                't', NEW.t,
                'v', NEW.v
            );
        WHEN 'send_token_transfers_backfill' THEN
            IF EXISTS (
                SELECT 1 FROM "public"."send_token_transfers"
                WHERE ig_name = target_ig_name
                  AND src_name = NEW.src_name
                  AND block_num = NEW.block_num
                  AND tx_idx = NEW.tx_idx
                  AND log_idx = NEW.log_idx
                  AND abi_idx = NEW.abi_idx
            ) THEN
                -- Return NULL to cancel the insert
                RETURN NULL;
            END IF;
            NEW.data = jsonb_build_object(
                'f', NEW.f,
                't', NEW.t,
                'v', NEW.v
            );
        ELSE
            RAISE EXCEPTION 'Invalid ig_name: %', NEW.ig_name;
    END CASE;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "shovel_backfill_before_insert" BEFORE INSERT ON "public"."shovel_backfill" FOR EACH ROW EXECUTE FUNCTION "public"."shovel_backfill_before_insert"();

ALTER FUNCTION "public"."shovel_backfill_before_insert"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."shovel_backfill_after_insert"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_ig_name text;
BEGIN
    target_ig_name := replace(NEW.ig_name, '_backfill', '');
    CASE NEW.ig_name
        WHEN 'send_account_transfers_backfill' THEN
            INSERT INTO "public"."send_account_transfers" (chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx)
            VALUES (NEW.chain_id, NEW.log_addr, NEW.block_time, NEW.tx_hash, NEW.data->>'f', NEW.data->>'t', NEW.data->>'v', target_ig_name, NEW.src_name, NEW.block_num, NEW.tx_idx, NEW.log_idx, NEW.abi_idx)
            ON CONFLICT (event_id) DO NOTHING;
        WHEN 'send_token_transfers_backfill' THEN
            INSERT INTO "public"."send_token_transfers" (chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx)
            VALUES (NEW.chain_id, NEW.log_addr, NEW.block_time, NEW.tx_hash, NEW.data->>'f', NEW.data->>'t', NEW.data->>'v', target_ig_name, NEW.src_name, NEW.block_num, NEW.tx_idx, NEW.log_idx, NEW.abi_idx)
            ON CONFLICT (event_id) DO NOTHING;
        ELSE
            RAISE EXCEPTION 'Invalid ig_name: %', NEW.ig_name;
    END CASE;
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."shovel_backfill_after_insert"() OWNER TO "postgres";

ALTER TABLE "public"."shovel_backfill" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_postgres_and_service_role_to_view_insert_or_delete" ON "public"."shovel_backfill" FOR INSERT OR DELETE TO postgres, service_role;