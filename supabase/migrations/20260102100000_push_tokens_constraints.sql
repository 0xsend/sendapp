-- Enforce push_tokens data integrity across platforms
--
-- Goal: prevent invalid/partial rows like platform='web' with token set, or missing web keys.
-- We add the CHECK constraint as NOT VALID to avoid failing on pre-existing dirty rows,
-- while still enforcing the rule for all new inserts/updates.

ALTER TABLE "public"."push_tokens"
  ADD CONSTRAINT "push_tokens_platform_fields_check"
  CHECK (
    (
      "platform" = 'expo'::push_token_platform
      AND "token" IS NOT NULL
      AND "endpoint" IS NULL
      AND "p256dh" IS NULL
      AND "auth" IS NULL
    )
    OR
    (
      "platform" = 'web'::push_token_platform
      AND "token" IS NULL
      AND "endpoint" IS NOT NULL
      AND "p256dh" IS NOT NULL
      AND "auth" IS NOT NULL
    )
  ) NOT VALID;

-- Harden register_push_token: it is for Expo tokens only.
-- Web push subscriptions must be registered via upsert_web_push_token.
CREATE OR REPLACE FUNCTION "public"."register_push_token"(
    token_value text,
    token_platform push_token_platform,
    token_device_id text DEFAULT NULL
)
RETURNS SETOF push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_result push_tokens%ROWTYPE;
BEGIN
    -- register_push_token is only for Expo tokens
    IF token_platform = 'web'::push_token_platform THEN
        RAISE EXCEPTION 'Use upsert_web_push_token for web push subscriptions';
    END IF;

    -- Get the current user's ID from auth context
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register push token';
    END IF;

    -- Upsert the push token (update if exists, insert if not)
    INSERT INTO push_tokens (
        user_id,
        platform,
        token,
        device_id,
        is_active,
        last_used_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        token_platform,
        token_value,
        token_device_id,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, platform, token) WHERE token IS NOT NULL
    DO UPDATE SET
        device_id = COALESCE(EXCLUDED.device_id, push_tokens.device_id),
        is_active = true,
        last_used_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN NEXT v_result;
END;
$$;

ALTER FUNCTION "public"."register_push_token"(text, push_token_platform, text) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "service_role";
