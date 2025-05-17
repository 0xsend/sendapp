-- remove trigger which checks if tag is in tags_reservations before insert/update
DROP TRIGGER IF EXISTS check_tags_allowlist_before_insert ON public.tags;

-- remove function that was used by removed trigger
DROP FUNCTION IF EXISTS public.check_tags_allowlist_before_insert_func();

-- remove table tag_reservations as it is not used
DROP TABLE IF EXISTS public.tag_reservations;

DO $$
BEGIN
-- Step 1: Create a temp table with user_ids and tag names from 'tags'
-- that do NOT have a corresponding record in 'send_accounts'.
CREATE TEMP TABLE temp_tags_to_delete AS
SELECT user_id, name AS tag_name
FROM tags
WHERE NOT EXISTS (
    SELECT 1 FROM send_accounts sa WHERE sa.user_id = tags.user_id
);

-- Step 2: Capture event_id and hash from tag_receipts linked to tags to be deleted
CREATE TEMP TABLE temp_tag_receipts_to_delete AS
SELECT tr.event_id, tr.hash
FROM tag_receipts tr
WHERE tr.tag_name IN (SELECT tag_name FROM temp_tags_to_delete);

-- Step 3: Delete from tags (this will cascade delete tag_receipts)
DELETE FROM tags
WHERE user_id IN (SELECT user_id FROM temp_tags_to_delete);

-- Step 4: Delete from referrals where referred_id matches those user_ids
DELETE FROM referrals
WHERE referred_id IN (SELECT user_id FROM temp_tags_to_delete);

-- Step 5: Delete from receipts where event_id or hash matches deleted tag_receipts
DELETE FROM receipts
WHERE
    (event_id IS NOT NULL AND event_id IN (SELECT event_id FROM temp_tag_receipts_to_delete WHERE event_id IS NOT NULL))
   OR
    (hash IS NOT NULL AND hash IN (SELECT hash FROM temp_tag_receipts_to_delete WHERE hash IS NOT NULL));

-- Temp tables will be dropped automatically at session end.
END
$$;
