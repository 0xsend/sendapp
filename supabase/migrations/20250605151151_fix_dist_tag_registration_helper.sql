set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_tag_registration_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
    INNER JOIN tag_receipts tr ON t.name = tr.tag_name;
END;
$function$
;


