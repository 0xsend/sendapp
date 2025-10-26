CREATE TABLE IF NOT EXISTS "public"."send_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "address" "public"."citext" NOT NULL,
    "chain_id" integer NOT NULL,
    "init_code" "bytea" NOT NULL,
    "main_tag_id" bigint,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chain_addresses_address_check" CHECK ((("length"(("address")::"text") = 42) AND ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext"))),
    "address_bytes" "bytea" GENERATED ALWAYS AS (
        CASE
            WHEN ("address" OPERATOR("public".~) '^0x[A-Fa-f0-9]{40}$'::"public"."citext")
                THEN decode(replace(address::text,'0x',''),'hex')
            ELSE NULL::bytea
        END
    ) STORED
);

ALTER TABLE "public"."send_accounts" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."send_accounts"
    ADD CONSTRAINT "send_accounts_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "idx_send_accounts_address" ON "public"."send_accounts" USING "btree" ("address");
CREATE INDEX "idx_send_accounts_address_user" ON "public"."send_accounts" USING "btree" ("address", "user_id");
CREATE UNIQUE INDEX "send_accounts_address_key" ON "public"."send_accounts" USING "btree" ("address", "chain_id");
CREATE INDEX "send_accounts_user_id_index" ON "public"."send_accounts" USING "btree" ("user_id");
CREATE INDEX "idx_send_accounts_main_tag_id" ON "public"."send_accounts" USING "btree" ("main_tag_id");
CREATE INDEX "idx_send_accounts_address_bytes" ON "public"."send_accounts" USING "btree" ( "address_bytes");
CREATE UNIQUE INDEX "send_accounts_address_bytes_key" ON "public"."send_accounts" USING "btree" ("address_bytes", "chain_id");
CREATE INDEX "idx_send_accounts_user_address_bytes" ON "public"."send_accounts" USING "btree" ("user_id", "address_bytes");

-- Foreign Keys
ALTER TABLE ONLY "public"."send_accounts"
    ADD CONSTRAINT "send_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."send_accounts"
    ADD CONSTRAINT "send_accounts_main_tag_id_fkey" FOREIGN KEY ("main_tag_id") REFERENCES "public"."tags"("id") ON DELETE SET NULL;

-- RLS
ALTER TABLE "public"."send_accounts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_own_accounts" ON "public"."send_accounts" FOR INSERT TO "authenticated" WITH CHECK (((SELECT auth.uid()) = "user_id"));

CREATE POLICY "select_own_accounts" ON "public"."send_accounts" FOR SELECT TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));

CREATE POLICY "update_own_accounts" ON "public"."send_accounts" FOR UPDATE TO "authenticated" USING (((SELECT auth.uid()) = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."send_accounts" TO "anon";
GRANT ALL ON TABLE "public"."send_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."send_accounts" TO "service_role";

-- Functions
CREATE OR REPLACE FUNCTION public.create_send_account(send_account send_accounts, webauthn_credential webauthn_credentials, key_slot integer)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
declare _send_account send_accounts;

_webauthn_credential webauthn_credentials;

begin --

-- insert the credential
insert into webauthn_credentials (
    name,
    display_name,
    raw_credential_id,
    public_key,
    sign_count,
    attestation_object,
    key_type
  )
values (
    webauthn_credential.name,
    webauthn_credential.display_name,
    webauthn_credential.raw_credential_id,
    webauthn_credential.public_key,
    webauthn_credential.sign_count,
    webauthn_credential.attestation_object,
    webauthn_credential.key_type
  )
returning * into _webauthn_credential;

-- insert the send account
insert into send_accounts (address, chain_id, init_code)
values (
    send_account.address,
    send_account.chain_id,
    send_account.init_code
  ) on conflict (address, chain_id) do
update
set init_code = excluded.init_code
returning * into _send_account;

-- associate the credential with the send account
insert into send_account_credentials (account_id, credential_id, key_slot)
values (
    _send_account.id,
    _webauthn_credential.id,
    $3
  );

-- return the send account
return json_build_object(
  'send_account',
  _send_account,
  'webauthn_credential',
  _webauthn_credential
);

end;

$function$
;

ALTER FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) RETURNS SETOF "public"."send_accounts"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions
    WHERE
      id = distribution_id
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- return the hodler addresses that had no sells during the qualification period and have verifications
  RETURN query WITH sellers AS(
    -- find sellers during the qualification period
    SELECT
      lower(concat('0x', encode(f, 'hex')))::citext AS seller
    FROM
      distributions
      JOIN send_token_transfers ON to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start
        AND to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
      JOIN send_liquidity_pools ON send_liquidity_pools.address = send_token_transfers.t
    WHERE
      distributions.id = $1)
    -- the hodler addresses that had no sells during the qualification period and have verifications
    SELECT DISTINCT
      send_accounts.*
    FROM
      distributions
      JOIN distribution_verifications ON distribution_verifications.distribution_id = distributions.id
      JOIN send_accounts ON send_accounts.user_id = distribution_verifications.user_id
    WHERE
      distributions.id = $1
      AND send_accounts.address NOT IN(
        SELECT
          seller
        FROM
          sellers);
END;
$_$;

ALTER FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) RETURNS "public"."webauthn_credentials"
    LANGUAGE "plpgsql"
    AS $_$
#variable_conflict use_column
declare
    _webauthn_credential webauthn_credentials;
    _key_slot alias for $3;
begin

    if ( select count(*) from send_accounts where id = send_account_id ) = 0 then
        raise exception 'Send account not found for ID %', send_account_id;
    end if;

    -- insert the credential
    insert into webauthn_credentials (name,
                                      display_name,
                                      raw_credential_id,
                                      public_key,
                                      sign_count,
                                      attestation_object,
                                      key_type)
    values (webauthn_credential.name,
            webauthn_credential.display_name,
            webauthn_credential.raw_credential_id,
            webauthn_credential.public_key,
            webauthn_credential.sign_count,
            webauthn_credential.attestation_object,
            webauthn_credential.key_type)
    returning * into _webauthn_credential;

    -- associate the credential with the send account replacing any existing credential with the same key slot
    insert into send_account_credentials (account_id, credential_id, key_slot)
    values (send_account_id,
            _webauthn_credential.id,
            _key_slot)
    on conflict (account_id, key_slot)
    do update set credential_id = _webauthn_credential.id, key_slot = _key_slot;

    -- return the result using the custom type
    return _webauthn_credential;
end;
$_$;

ALTER FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION public.send_accounts_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN -- Ensure that a user does not exceed the send_accounts limit
    IF (
           SELECT COUNT(*)
           FROM public.send_accounts
           WHERE user_id = NEW.user_id
       ) > 1 THEN RAISE EXCEPTION 'User can have at most 1 send account';

    END IF;

-- Return the new record to be inserted or updated
    RETURN NEW;

END;

$function$
;


ALTER FUNCTION "public"."send_accounts_after_insert"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_verification_create_passkey()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;
  -- Insert verification for create_passkey
  IF curr_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT
      1
    FROM
      public.distribution_verifications
    WHERE
      user_id = NEW.user_id AND distribution_id = curr_distribution_id AND type = 'create_passkey'::public.verification_type) THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      metadata,
      created_at -- Removed the extra comma here
)
    VALUES (
      curr_distribution_id,
      NEW.user_id,
      'create_passkey' ::public.verification_type,
      jsonb_build_object(
        'account_created_at', NEW.created_at),
      NEW.created_at);
  END IF;
  RETURN NEW;
END;
$function$
;

ALTER FUNCTION "public"."insert_verification_create_passkey"() OWNER TO "postgres";

-- Function Grants
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_send_account"("send_account" "public"."send_accounts", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_accounts_add_webauthn_credential"("send_account_id" "uuid", "webauthn_credential" "public"."webauthn_credentials", "key_slot" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_accounts_after_insert"() TO "service_role";

GRANT ALL ON FUNCTION "public"."distribution_hodler_addresses"("distribution_id" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_create_passkey"() TO "service_role";

-- Additional Functions for main_tag_id
CREATE OR REPLACE FUNCTION public.validate_main_tag_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $$
BEGIN
  -- Only prevent setting to NULL if there are other confirmed tags available
  IF NEW.main_tag_id IS NULL AND OLD.main_tag_id IS NOT NULL AND EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed') THEN
    RAISE EXCEPTION 'Cannot set main_tag_id to NULL while you have confirmed tags';
  END IF;
  -- Verify the new main_tag_id is one of the user's confirmed tags
  IF NEW.main_tag_id IS NOT NULL AND NOT EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed' AND t.id = NEW.main_tag_id) THEN
    RAISE EXCEPTION 'main_tag_id must be one of your confirmed tags';
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."validate_main_tag_update"() OWNER TO "postgres";

GRANT ALL ON FUNCTION "public"."validate_main_tag_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_main_tag_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_main_tag_update"() TO "service_role";


-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_create_passkey" AFTER INSERT ON "public"."send_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_create_passkey"();

CREATE OR REPLACE TRIGGER "trigger_send_accounts_after_insert" AFTER INSERT OR UPDATE ON "public"."send_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."send_accounts_after_insert"();

CREATE TRIGGER "validate_main_tag_update"
    BEFORE UPDATE OF main_tag_id ON "public"."send_accounts"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_main_tag_update"();
