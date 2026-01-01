-- Add missing columns to push_tokens table for better device management
-- Note: We don't add 'expo' as a platform - Expo tokens are stored under 'ios' or 'android'
-- and identified by their token format (ExponentPushToken[...] or ExpoPushToken[...])

-- Add device_id column for identifying specific devices
ALTER TABLE "public"."push_tokens" ADD COLUMN IF NOT EXISTS "device_id" text;

-- Add is_active column to track token validity (default true)
ALTER TABLE "public"."push_tokens" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;

-- Add last_used_at column to track token activity
ALTER TABLE "public"."push_tokens" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp with time zone;

-- Create or replace the register_push_token function for registering/updating push tokens
CREATE OR REPLACE FUNCTION "public"."register_push_token"(
    token_value text,
    token_platform push_token_platform,
    token_device_id text DEFAULT NULL
)
RETURNS SETOF push_tokens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_result push_tokens%ROWTYPE;
BEGIN
    -- Get the current user's ID
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION "public"."register_push_token"(text, push_token_platform, text) TO authenticated;

-- Create index on is_active for efficient querying of active tokens
CREATE INDEX IF NOT EXISTS "push_tokens_is_active_idx" ON "public"."push_tokens" USING btree ("is_active") WHERE "is_active" = true;

-- Update the updated_at trigger to also update last_used_at when token is used
-- (The existing trigger only updates updated_at)
