-- delete tag registration verifications for free tags aka they have no receipts
DELETE FROM distribution_verifications dv
WHERE distribution_id = (
        SELECT id
        FROM distributions
        WHERE "number" = 15
        LIMIT 1
    )
    AND type = 'tag_registration'
    AND NOT EXISTS (
        SELECT 1
        FROM tag_receipts tr
        WHERE tr.tag_name = dv.metadata::jsonb ->> 'tag'
    );

-- Update weights for existing purchased tags
UPDATE distribution_verifications
SET weight =
    CASE
        WHEN LENGTH(metadata::jsonb ->> 'tag') >= 6 THEN 1
        WHEN LENGTH(metadata::jsonb ->> 'tag') = 5 THEN 2
        WHEN LENGTH(metadata::jsonb ->> 'tag') = 4 THEN 3
        WHEN LENGTH(metadata::jsonb ->> 'tag') > 0  THEN 4
        ELSE 0
    END
WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE "number" = 15
    LIMIT 1
)
AND type = 'tag_registration';

CREATE OR REPLACE FUNCTION insert_tag_registration_verifications(distribution_num integer)
RETURNS void AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        (
            SELECT id
            FROM distributions
            WHERE "number" = distribution_num
            LIMIT 1
        ),
        t.user_id,
        'tag_registration'::public.verification_type,
        jsonb_build_object('tag', t."name"),
        CASE
            WHEN LENGTH(t.name) >= 6 THEN 1
            WHEN LENGTH(t.name) = 5 THEN 2
            WHEN LENGTH(t.name) = 4 THEN 3 -- Increase reward value of shorter tags
            WHEN LENGTH(t.name) > 0  THEN 4
            ELSE 0
        END,
        t.created_at
    FROM tags t
    INNER JOIN tag_receipt tr ON t.name = tr.tag_name;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and function
DROP TRIGGER IF EXISTS insert_verification_tag_registration ON public.tags;
DROP FUNCTION IF EXISTS public.insert_verification_tag_registration();

CREATE OR REPLACE FUNCTION public.insert_verification_tag_registration_from_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    curr_distribution_id bigint;
    tag_user_id uuid;
BEGIN
    -- Get the tag's user_id
    SELECT user_id INTO tag_user_id
    FROM tags
    WHERE name = NEW.tag_name;

    -- If no tag found, return
    IF tag_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- get the current distribution id
    curr_distribution_id := (
        SELECT id
        FROM distributions
        WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
            AND qualification_end >= (now() AT TIME ZONE 'UTC')
        ORDER BY qualification_start DESC
        LIMIT 1
    );

    -- check if a verification for the same user, tag, and distribution already exists
    IF curr_distribution_id IS NOT NULL THEN
        -- insert new verification
        INSERT INTO public.distribution_verifications (
            distribution_id,
            user_id,
            type,
            metadata,
            weight
        )
        VALUES (
            curr_distribution_id,
            tag_user_id,
            'tag_registration'::public.verification_type,
            jsonb_build_object('tag', NEW.tag_name),
            CASE
                WHEN LENGTH(NEW.tag_name) >= 6 THEN 1
                WHEN LENGTH(NEW.tag_name) = 5 THEN 2
                WHEN LENGTH(NEW.tag_name) = 4 THEN 3
                WHEN LENGTH(NEW.tag_name) > 0  THEN 4
                ELSE 0
            END
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create new trigger on tag_receipts
CREATE TRIGGER insert_verification_tag_registration_from_receipt
AFTER INSERT ON public.tag_receipts
FOR EACH ROW
EXECUTE PROCEDURE public.insert_verification_tag_registration_from_receipt();