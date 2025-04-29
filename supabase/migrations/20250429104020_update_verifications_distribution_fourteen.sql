DELETE FROM public.distribution_verifications
WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE "number" = 14
    LIMIT 1
)
AND type = 'create_passkey'
AND user_id IN (
    SELECT sa.user_id
    FROM send_accounts sa
    WHERE sa.created_at < (
        SELECT qualification_start
        FROM distributions
        WHERE "number" = 14
        LIMIT 1
    )
    OR sa.created_at > (
        SELECT qualification_end
        FROM distributions
        WHERE "number" = 14
        LIMIT 1
    )
);

UPDATE public.distribution_verification_values
SET fixed_value = 50000000000000000000  -- 50 SEND
WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE "number" = 14
    LIMIT 1
)
AND type = 'send_ten';

UPDATE public.distribution_verification_values
SET fixed_value = 5000000000000000000  -- 5 SEND per day
WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE "number" = 14
    LIMIT 1
)
AND type = 'send_streak';


