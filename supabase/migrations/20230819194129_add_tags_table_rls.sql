-- Enable Row Level Security (RLS) to enhance table security
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Set the default user ID to the authenticated user's ID for new tag inserts
ALTER TABLE public.tags
ALTER COLUMN user_id
SET DEFAULT auth.uid();

-- RLS Policies
-- Policy for selecting tags: Users can only select their own tags
CREATE POLICY select_policy ON public.tags FOR
SELECT USING (auth.uid() = user_id);

-- Policy for inserting tags: Users can only insert tags for themselves
CREATE POLICY insert_policy ON public.tags FOR
INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating tags: Users can only update their own tags
CREATE POLICY update_policy ON public.tags FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Only allow users to delete pending tags
CREATE POLICY delete_policy ON public.tags FOR DELETE TO authenticated USING (
    auth.uid() = user_id
    AND status = 'pending'::public.tag_status
);

-- Trigger function to ensure data integrity during tag insertion and updates
CREATE OR REPLACE FUNCTION tags_before_insert_or_update_func() RETURNS TRIGGER LANGUAGE plpgsql security definer
set search_path = public VOLATILE AS $$ BEGIN -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create or modify tags for themselves';

END IF;

-- Ensure user is not changing their confirmed tag name
IF NEW.status = 'confirmed'::public.tag_status
AND OLD.name <> NEW.name
AND current_setting('role')::text != 'service_role' THEN RAISE EXCEPTION 'Users cannot change the name of a confirmed tag';

END IF;

-- Ensure user is not confirming their own tag
IF NEW.status = 'confirmed'::public.tag_status
AND current_setting('role')::text != 'service_role' THEN RAISE EXCEPTION 'Users cannot confirm their own tags';

END IF;

-- Ensure no existing pending tag with same name within the last 30 minutes by another user
IF EXISTS (
    SELECT 1
    FROM public.tags
    WHERE name = NEW.name
        AND status = 'pending'::public.tag_status
        AND (NOW() - created_at) < INTERVAL '30 minutes'
        AND user_id != NEW.user_id
) THEN RAISE EXCEPTION 'Tag with same name already exists';

END IF;

-- Delete older pending tags if they belong to the same user, to avoid duplicates
DELETE FROM public.tags
WHERE name = NEW.name
    AND user_id != NEW.user_id
    AND status = 'pending'::public.tag_status;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$$;

-- Assign the trigger function to the tags table to be invoked before inserts or updates
CREATE OR REPLACE TRIGGER trigger_tags_before_insert_or_update BEFORE
INSERT
    OR
UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION tags_before_insert_or_update_func();

-- Trigger function to ensure data integrity during tag insertion and updates
CREATE OR REPLACE FUNCTION tags_after_insert_or_update_func() RETURNS TRIGGER LANGUAGE plpgsql security definer
set search_path = public AS $$ BEGIN -- Ensure that a user does not exceed the tag limit
    IF (
        SELECT COUNT(*)
        FROM public.tags
        WHERE user_id = NEW.user_id
            AND TG_OP = 'INSERT'
    ) > 5 THEN RAISE EXCEPTION 'User can have at most 5 tags';

END IF;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$$;

-- Assign the trigger function to the tags table to be invoked before inserts or updates
CREATE OR REPLACE TRIGGER trigger_tags_after_insert_or_update
AFTER
INSERT
    OR
UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION tags_after_insert_or_update_func();
