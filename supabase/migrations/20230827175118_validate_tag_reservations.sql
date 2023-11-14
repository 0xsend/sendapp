set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_tags_allowlist_before_insert_func() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $function$
DECLARE tag_allowlist RECORD;

BEGIN -- check if tag name is in the allowlist and the verified chain address matches
SELECT *
FROM tag_reservations
WHERE tag_name = NEW.name INTO tag_allowlist;

IF FOUND THEN IF (
    SELECT address
    FROM chain_addresses
    WHERE user_id = auth.uid()
        AND tag_allowlist.chain_address = address
) IS NULL THEN RAISE EXCEPTION 'You don''t got the riz for the tag: %',
NEW.name;

END IF;

END IF;

-- Return the new record to be inserted or updated
RETURN NEW;

END;

$function$;

CREATE OR REPLACE TRIGGER check_tags_allowlist_before_insert BEFORE
INSERT
    OR
UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION check_tags_allowlist_before_insert_func();
