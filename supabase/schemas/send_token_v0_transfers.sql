-- Filter function to ensure transfers only include existing send accounts
-- create trigger function for filtering send_token_v0_transfers with no send_account_created
-- Deletes send_token_v0_transfers with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_token_v0_transfers with send_account_created.
-- For now, we index all SENDV0 token transfers, and use this function filter any send_token_v0_transfers with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
CREATE OR REPLACE FUNCTION private.filter_send_token_v0_transfers_with_no_send_account_created()
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

ALTER FUNCTION "private"."filter_send_token_v0_transfers_with_no_send_account_created"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."send_token_v0_transfers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."send_token_v0_transfers_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."send_token_v0_transfers" (
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
ALTER TABLE "public"."send_token_v0_transfers" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."send_token_v0_transfers_id_seq" OWNED BY "public"."send_token_v0_transfers"."id";
ALTER TABLE ONLY "public"."send_token_v0_transfers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."send_token_v0_transfers_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_token_v0_transfers"
    ADD CONSTRAINT "send_token_v0_transfers_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "send_token_v0_transfers_block_num" ON "public"."send_token_v0_transfers" USING "btree" ("block_num");
CREATE INDEX "send_token_v0_transfers_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("block_time");
CREATE INDEX "send_token_v0_transfers_composite" ON "public"."send_token_v0_transfers" USING "btree" ("block_time", "f", "t", "v");
CREATE INDEX "send_token_v0_transfers_f" ON "public"."send_token_v0_transfers" USING "btree" ("f");
CREATE INDEX "send_token_v0_transfers_t" ON "public"."send_token_v0_transfers" USING "btree" ("t");
CREATE UNIQUE INDEX "u_send_token_v0_transfers" ON "public"."send_token_v0_transfers" USING "btree" ("ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx");
CREATE INDEX "idx_send_token_v0_transfers_f_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("f", "block_time");
CREATE INDEX "idx_send_token_v0_transfers_t_block_time" ON "public"."send_token_v0_transfers" USING "btree" ("t", "block_time");

-- RLS
ALTER TABLE "public"."send_token_v0_transfers" ENABLE ROW LEVEL SECURITY;

create policy "users can see their own transfers"
on "public"."send_token_v0_transfers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address_bytes = send_token_v0_transfers.f) OR (send_accounts.address_bytes = send_token_v0_transfers.t))))));



-- Grants
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "anon";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."send_token_v0_transfers" TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_token_v0_transfers_id_seq" TO "service_role";

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_sends" AFTER INSERT ON "public"."send_token_v0_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_sends"();
CREATE OR REPLACE TRIGGER "insert_verification_send_ceiling" AFTER INSERT ON "public"."send_token_v0_transfers" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_send_ceiling"();
CREATE OR REPLACE TRIGGER "filter_send_token_v0_transfers_with_no_send_account_created" BEFORE INSERT ON "public"."send_token_v0_transfers" FOR EACH ROW EXECUTE FUNCTION "private"."filter_send_token_v0_transfers_with_no_send_account_created"();
