-- Harden Supabase RLS/grants and push-token RPCs
-- 
-- Security fixes:
-- 1. upsert_web_push_token: Remove p_user_id parameter, derive from auth.uid()
-- 2. Revoke overly broad grants from anon role
-- 3. Tighten grants on tables and sequences
-- 4. Add SET search_path to functions

-- ============================================
-- FIX upsert_web_push_token: Remove p_user_id parameter
-- CRITICAL: This prevents cross-user token registration
-- ============================================

DROP FUNCTION IF EXISTS "public"."upsert_web_push_token"("uuid", "text", "text", "text");

CREATE OR REPLACE FUNCTION "public"."upsert_web_push_token"(
    p_endpoint "text",
    p_p256dh "text",
    p_auth "text"
) RETURNS void
    LANGUAGE "plpgsql"
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    -- Derive user identity from auth context - prevents cross-user writes
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to register web push token';
    END IF;

    INSERT INTO public.push_tokens (user_id, platform, token, endpoint, p256dh, auth)
    VALUES (v_user_id, 'web', NULL, p_endpoint, p_p256dh, p_auth)
    ON CONFLICT (user_id, endpoint) WHERE platform = 'web'
    DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        updated_at = clock_timestamp();
END;
$$;

ALTER FUNCTION "public"."upsert_web_push_token"("text", "text", "text") OWNER TO "postgres";

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."upsert_web_push_token"("text", "text", "text") TO "service_role";

-- ============================================
-- Ensure register_push_token has proper search_path
-- (Already uses auth.uid() correctly, just add search_path)
-- ============================================

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

-- Ensure proper ownership and grants
ALTER FUNCTION "public"."register_push_token"(text, push_token_platform, text) OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO "service_role";

-- ============================================
-- Revoke ALL grants from anon on notifications/push_tokens
-- anon should not have access to these tables
-- ============================================

-- Revoke from notifications table
REVOKE ALL ON TABLE "public"."notifications" FROM "anon";

-- Revoke from push_tokens table  
REVOKE ALL ON TABLE "public"."push_tokens" FROM "anon";

-- Revoke sequence access from anon
REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "anon";
REVOKE ALL ON SEQUENCE "public"."push_tokens_id_seq" FROM "anon";

-- ============================================
-- Ensure authenticated has proper (minimal) grants
-- RLS will enforce row-level access
-- ============================================

-- Notifications: authenticated needs CRUD for their own rows (RLS enforces)
REVOKE ALL ON TABLE "public"."notifications" FROM "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."notifications" TO "authenticated";

-- Push tokens: authenticated needs CRUD for their own rows (RLS enforces)
REVOKE ALL ON TABLE "public"."push_tokens" FROM "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."push_tokens" TO "authenticated";

-- Sequences: authenticated needs USAGE for inserting rows
REVOKE ALL ON SEQUENCE "public"."notifications_id_seq" FROM "authenticated";
GRANT USAGE ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";

REVOKE ALL ON SEQUENCE "public"."push_tokens_id_seq" FROM "authenticated";
GRANT USAGE ON SEQUENCE "public"."push_tokens_id_seq" TO "authenticated";

-- ============================================
-- Service role keeps full access (for backend operations)
-- ============================================

GRANT ALL ON TABLE "public"."notifications" TO "service_role";
GRANT ALL ON TABLE "public"."push_tokens" TO "service_role";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."push_tokens_id_seq" TO "service_role";

-- ============================================
-- Add SET search_path to update_push_token_updated_at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION "public"."update_push_token_updated_at"() 
RETURNS "trigger"
LANGUAGE "plpgsql"
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."update_push_token_updated_at"() OWNER TO "postgres";
