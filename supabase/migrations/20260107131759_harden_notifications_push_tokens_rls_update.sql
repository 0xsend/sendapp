-- Harden RLS policies for notifications + push_tokens
--
-- Motivation: The original UPDATE policies only had a USING clause.
-- Without a WITH CHECK clause, a user who owns a row can UPDATE it to change user_id,
-- effectively reassigning the row to another user (row hijack / push-token poisoning).
--
-- This migration re-creates the policies scoped to authenticated and adds WITH CHECK
-- for UPDATE to ensure the new row still belongs to auth.uid().

-- ============================================
-- notifications
-- ============================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON "public"."notifications";
DROP POLICY IF EXISTS "Users can insert their own notifications" ON "public"."notifications";
DROP POLICY IF EXISTS "Users can update their own notifications" ON "public"."notifications";
DROP POLICY IF EXISTS "Users can delete their own notifications" ON "public"."notifications";

CREATE POLICY "Users can view their own notifications"
ON "public"."notifications"
FOR SELECT
TO "authenticated"
USING (auth.uid() = "user_id");

CREATE POLICY "Users can insert their own notifications"
ON "public"."notifications"
FOR INSERT
TO "authenticated"
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update their own notifications"
ON "public"."notifications"
FOR UPDATE
TO "authenticated"
USING (auth.uid() = "user_id")
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can delete their own notifications"
ON "public"."notifications"
FOR DELETE
TO "authenticated"
USING (auth.uid() = "user_id");

-- ============================================
-- push_tokens
-- ============================================
DROP POLICY IF EXISTS "Users can view their own push tokens" ON "public"."push_tokens";
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON "public"."push_tokens";
DROP POLICY IF EXISTS "Users can update their own push tokens" ON "public"."push_tokens";
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON "public"."push_tokens";

CREATE POLICY "Users can view their own push tokens"
ON "public"."push_tokens"
FOR SELECT
TO "authenticated"
USING (auth.uid() = "user_id");

CREATE POLICY "Users can insert their own push tokens"
ON "public"."push_tokens"
FOR INSERT
TO "authenticated"
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can update their own push tokens"
ON "public"."push_tokens"
FOR UPDATE
TO "authenticated"
USING (auth.uid() = "user_id")
WITH CHECK (auth.uid() = "user_id");

CREATE POLICY "Users can delete their own push tokens"
ON "public"."push_tokens"
FOR DELETE
TO "authenticated"
USING (auth.uid() = "user_id");
