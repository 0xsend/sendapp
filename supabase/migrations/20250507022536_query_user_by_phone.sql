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

