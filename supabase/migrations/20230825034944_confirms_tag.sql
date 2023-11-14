-- confirm_tags function is used to confirm that the tags are valid. Tag names 1-5 characters in length require a receipt. 6 or more characters can be confirmed without a receipt.
CREATE OR REPLACE FUNCTION confirm_tags(
    tag_names citext [],
    receipt_hash citext
  ) RETURNS void LANGUAGE plpgsql security definer
set search_path = 'public' AS $$
DECLARE tag_owner_ids uuid [];

distinct_user_ids INT;

tag_owner_id uuid;

free_tags citext [];

paid_tags citext [];

BEGIN -- Check if the tags exist and fetch their owners.
SELECT array_agg(user_id) INTO tag_owner_ids
FROM public.tags
WHERE name = ANY(tag_names)
  AND status = 'pending'::public.tag_status;

-- If any of the tags do not exist or are not in pending status, throw an error.
IF array_length(tag_owner_ids, 1) <> array_length(tag_names, 1) THEN RAISE EXCEPTION 'One or more tags do not exist or are not in pending status.';

END IF;

-- Check if all tags belong to the same user
SELECT count(DISTINCT user_id) INTO distinct_user_ids
FROM unnest(tag_owner_ids) AS user_id;

IF distinct_user_ids <> 1 THEN RAISE EXCEPTION 'Tags must belong to the same user.';

END IF;

-- Fetch single user_id
SELECT DISTINCT user_id INTO tag_owner_id
FROM unnest(tag_owner_ids) AS user_id;

-- Separate tags into free and paid
SELECT ARRAY(
    SELECT tag
    FROM unnest(tag_names) AS tag
    WHERE LENGTH(tag) >= 6
  ) INTO free_tags;

SELECT ARRAY(
    SELECT tag
    FROM unnest(tag_names) AS tag
    WHERE LENGTH(tag) < 6
  ) INTO paid_tags;

-- Confirm free tags (6 or more characters) without a receipt
IF ARRAY_LENGTH(free_tags, 1) IS NOT NULL THEN
UPDATE public.tags
SET status = 'confirmed'::public.tag_status
WHERE name = ANY(free_tags)
  AND status = 'pending'::public.tag_status;

END IF;

-- Confirm paid tags (1-5 characters) with a receipt
IF ARRAY_LENGTH(paid_tags, 1) IS NOT NULL THEN IF receipt_hash IS NULL
OR receipt_hash = '' THEN RAISE EXCEPTION 'Receipt hash is required for paid tags.';

END IF;

UPDATE public.tags
SET status = 'confirmed'::public.tag_status
WHERE name = ANY(paid_tags)
  AND status = 'pending'::public.tag_status;

-- Create a receipt for the paid tags
INSERT INTO public.receipts (hash, user_id)
VALUES (receipt_hash, tag_owner_id);

-- Associate the paid tags with the receipt hash
INSERT INTO public.tag_receipts (tag_name, hash)
SELECT unnest(paid_tags),
  receipt_hash;

END IF;

END;

$$;

REVOKE EXECUTE ON FUNCTION confirm_tags(tag_names citext [], receipt_hash citext)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION confirm_tags(tag_names citext [], receipt_hash citext)
FROM anon;

REVOKE EXECUTE ON FUNCTION confirm_tags(tag_names citext [], receipt_hash citext)
FROM authenticated;

-- admins only
GRANT EXECUTE ON FUNCTION confirm_tags(tag_names citext [], receipt_hash citext) TO service_role;
