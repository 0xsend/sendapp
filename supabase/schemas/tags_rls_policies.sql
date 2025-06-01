-- Update tags RLS policies after send_account_tags is created
-- This file should be loaded after send_account_tags.sql
-- Create proper policies with send_account_tags references

-- Allow users to delete their own pending tags via send_account_tags
CREATE POLICY "delete_policy" ON "public"."tags" FOR DELETE TO "authenticated"
USING (
    status = 'pending'::public.tag_status
    AND EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);

-- Allow inserts only if user_id matches for backward compatibility with tests, the tag will be created in pending status
CREATE POLICY "insert_policy" ON "public"."tags" FOR INSERT
WITH CHECK (
    ((SELECT auth.uid()) = user_id AND user_id IS NOT NULL)
);

-- Allow users to see their own tags
CREATE POLICY "select_policy" ON "public"."tags" FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);

-- Allow users to update their own pending tags (restrictive policy)
CREATE POLICY "update_policy" ON "public"."tags" FOR UPDATE TO "authenticated"
USING (
    status = 'pending'::public.tag_status
    AND EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS ( -- Ensure tag is associated with a send account
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);
