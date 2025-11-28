-- Account Deletion Function (Admin-only)
-- Deletes a user account by user_id
-- This will trigger CASCADE deletes across all related tables
-- This function should only be called by the service role (admin)

CREATE OR REPLACE FUNCTION public.delete_user_account(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Validate that user_id is provided
    IF user_id_to_delete IS NULL THEN
        RAISE EXCEPTION 'User ID must be provided';
    END IF;

    -- Manual deletion: temporal.send_account_transfers
    -- This table contains user_id without a foreign key constraint
    -- Must be deleted before auth.users deletion
    DELETE FROM temporal.send_account_transfers
    WHERE user_id = user_id_to_delete;

    -- Delete the user from auth.users
    -- This will trigger CASCADE deletes across all related tables
    -- including: profiles, send_accounts, tags, chain_addresses, receipts,
    -- activity, referrals, distribution_verifications, webauthn_credentials, etc.
    DELETE FROM auth.users WHERE id = user_id_to_delete;

    -- Note: The user's session will be invalidated after this operation
END;
$$;

-- Revoke all public access
REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_user_account(uuid) FROM authenticated;

-- Only service_role (admin) can execute this function
GRANT EXECUTE ON FUNCTION public.delete_user_account(uuid) TO service_role;

COMMENT ON FUNCTION public.delete_user_account(uuid) IS 'Admin-only function to permanently delete a user account and all associated data. This operation triggers CASCADE deletes across all related tables. Should only be called by service role with explicit user_id parameter.';
