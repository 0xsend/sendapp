CREATE OR REPLACE FUNCTION query_webauthn_credentials_by_phone(phone_number TEXT)
RETURNS SETOF webauthn_credentials
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT wc.*
    FROM auth.users AS u
    JOIN webauthn_credentials AS wc ON u.id = wc.user_id
    WHERE u.phone = phone_number;
$$;

REVOKE EXECUTE ON FUNCTION query_webauthn_credentials_by_phone(phone_number TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION query_webauthn_credentials_by_phone(phone_number TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION query_webauthn_credentials_by_phone(phone_number TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION query_webauthn_credentials_by_phone(phone_number TEXT) TO service_role;

-- Drop the existing trigger
DROP TRIGGER IF EXISTS "insert_verification_tag_registration" ON "public"."tags";

-- Recreate it for both INSERT and UPDATE
CREATE TRIGGER "insert_verification_tag_registration"
AFTER INSERT OR UPDATE ON "public"."tags"
FOR EACH ROW EXECUTE PROCEDURE "public"."insert_verification_tag_registration"();