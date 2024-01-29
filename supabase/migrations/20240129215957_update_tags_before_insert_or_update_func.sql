set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.tags_before_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ BEGIN

    RAISE NOTICE 'current role is %', current_setting('role')::text;

    -- Ensure users can only insert or update their own tags
    IF NEW.user_id <> auth.uid() THEN RAISE EXCEPTION 'Users can only create or modify tags for themselves';

    END IF;

-- Ensure user is not changing their confirmed tag name
    IF NEW.status = 'confirmed'::public.tag_status
        AND OLD.name <> NEW.name
        AND current_setting('role')::text = 'authenticated' THEN RAISE EXCEPTION 'Users cannot change the name of a confirmed tag';

    END IF;

-- Ensure user is not confirming their own tag
    IF NEW.status = 'confirmed'::public.tag_status
        AND current_setting('role')::text = 'authenticated' THEN RAISE EXCEPTION 'Users cannot confirm their own tags';

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

$function$
;


