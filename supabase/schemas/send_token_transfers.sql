-- Filter function to ensure transfers only include existing send accounts
-- create trigger function for filtering send_token_transfers with no send_account_created
-- Deletes send_token_transfers with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_token_transfers with send_account_created.
-- For now, we index all SEND token transfers, and use this function filter any send_token_transfers with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
CREATE OR REPLACE FUNCTION private.filter_send_token_transfers_with_no_send_account_created()
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

ALTER FUNCTION "private"."filter_send_token_transfers_with_no_send_account_created"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_token_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_token_transfers_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_token_transfers" (
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
ALTER TABLE "public"."send_token_transfers" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_token_transfers_id_seq" OWNED BY "public"."send_token_transfers"."id";
ALTER TABLE ONLY "public"."send_token_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_token_transfers_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_token_transfers"
    ADD CONSTRAINT "send_token_transfers_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_token_transfers_block_num" ON "public"."send_token_transfers" USING "btree" ("block_num");
CREATE INDEX "send_token_transfers_block_time" ON "public"."send_token_transfers" USING "btree" ("block_time");
CREATE INDEX "send_token_transfers_composite" ON "public"."send_token_transfers" USING "btree" ("block_time", "f", "t", "v");
CREATE INDEX "send_token_transfers_f" ON "public"."send_token_transfers" USING "btree" ("f");
CREATE INDEX "send_token_transfers_t" ON "public"."send_token_transfers" USING "btree" ("t");
CREATE UNIQUE INDEX "u_send_token_transfers" ON "public"."send_token_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE INDEX "idx_send_token_transfers_f_t_block_time" ON "public"."send_token_transfers" USING "btree" ("f", "t", "block_time");

-- RLS
ALTER TABLE "public"."send_token_transfers" ENABLE ROW LEVEL SECURITY;
create policy "users can see their own transfers"
on "public"."send_token_transfers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address = (lower(concat('0x', encode(send_token_transfers.f, 'hex'::text))))::citext) OR (send_accounts.address = (lower(concat('0x', encode(send_token_transfers.t, 'hex'::text))))::citext))))));



-- Grants
GRANT ALL ON TABLE "public"."send_token_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_token_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_token_transfers" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_token_transfers_id_seq" TO "service_role";


-- DEFERRABLE trigger: on distribution change, refresh history as needed and insert tag registrations
CREATE OR REPLACE FUNCTION public.refresh_scores_on_distribution_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_distribution_id bigint;
  active_distribution_number integer;
  previous_distribution_id bigint;
BEGIN
  -- Run-once per transaction guard: emulate statement-level deferral so this
  -- function executes its core logic only once at commit, even though the
  -- trigger is FOR EACH ROW and DEFERRABLE. We use a tx-local GUC flag.
  IF current_setting('vars.refresh_scores_on_distribution_change_done', true) = '1' THEN
    RETURN NEW;
  END IF;
  PERFORM set_config('vars.refresh_scores_on_distribution_change_done', '1', true);

  -- Compute active distribution and previous distribution id in one pass
  WITH now_utc AS (
    SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
  ), active AS (
    SELECT id, number
    FROM distributions, now_utc n
    WHERE n.now_ts >= qualification_start
      AND n.now_ts <  qualification_end
    ORDER BY qualification_start DESC
    LIMIT 1
  ), prev AS (
    SELECT d.id
    FROM distributions d
    JOIN active a ON d.number = a.number - 1
    LIMIT 1
  ), prev_closed AS (
    SELECT id
    FROM distributions, now_utc n
    WHERE qualification_end < n.now_ts
    ORDER BY qualification_end DESC
    LIMIT 1
  )
  SELECT
    (SELECT id FROM active),
    (SELECT number FROM active),
    COALESCE((SELECT id FROM prev), (SELECT id FROM prev_closed))
  INTO active_distribution_id, active_distribution_number, previous_distribution_id;

  -- Winner-only gating: take an advisory lock per previous_distribution_id so only one
  -- transaction checks and refreshes the MV. Others skip this section and proceed.
  IF previous_distribution_id IS NOT NULL THEN
    -- Use two-key advisory lock: namespace 918273645 and the distribution id (cast to int4).
    -- Distribution ids are small in this system; cast is safe. Adjust if that changes.
    IF pg_try_advisory_xact_lock(918273645, previous_distribution_id::int) THEN
      -- Now safe to access the MV; non-winners won't block on MV locks.
      IF NOT EXISTS (
        SELECT 1 FROM private.send_scores_history h
        WHERE h.distribution_id = previous_distribution_id
        LIMIT 1
      ) THEN
        REFRESH MATERIALIZED VIEW private.send_scores_history;
      END IF;
    END IF;
  END IF;

  -- Insert tag registration verifications for the current active distribution once
  IF active_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.distribution_verifications dv
    WHERE dv.distribution_id = active_distribution_id
      AND dv.type = 'tag_registration'
    LIMIT 1
  ) THEN
    PERFORM public.insert_tag_registration_verifications(active_distribution_number);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_scores_on_distribution_change() FROM PUBLIC;
GRANT ALL ON FUNCTION public.refresh_scores_on_distribution_change() TO service_role;

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_send_ceiling_trigger" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_send_ceiling"();
CREATE OR REPLACE TRIGGER "insert_verification_sends" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();
CREATE OR REPLACE TRIGGER "insert_send_streak_verification" AFTER INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_send_streak_verification"();
-- Single DEFERRABLE trigger that refreshes history and inserts tag registrations on distribution change
CREATE CONSTRAINT TRIGGER "refresh_send_scores_on_first_transfer"
AFTER INSERT ON "public"."send_token_transfers"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "public"."refresh_scores_on_distribution_change"();

CREATE OR REPLACE TRIGGER "filter_send_token_transfers_with_no_send_account_created" BEFORE INSERT ON "public"."send_token_transfers" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_token_transfers_with_no_send_account_created"();
