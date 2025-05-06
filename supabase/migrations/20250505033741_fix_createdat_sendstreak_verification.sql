CREATE OR REPLACE FUNCTION public.insert_send_streak_verifications(distribution_num integer)
RETURNS VOID AS $$
BEGIN
    -- Perform the entire operation within a single function
    WITH distribution_info AS (
        SELECT
            id,
            qualification_start,
            qualification_end
        FROM
            distributions
        WHERE
            "number" = distribution_num
        LIMIT 1
    ),
    daily_transfers AS (
        SELECT
            sa.user_id,
            DATE(to_timestamp(sat.block_time) AT TIME ZONE 'UTC') AS transfer_date,
            COUNT(DISTINCT sat.t) AS unique_recipients
        FROM
            send_account_transfers sat
            JOIN send_accounts sa ON sa.address = CONCAT('0x', ENCODE(sat.f, 'hex'))::CITEXT
        WHERE
            sat.block_time >= EXTRACT(EPOCH FROM (
                SELECT
                    qualification_start
                FROM distribution_info))
            AND sat.block_time < EXTRACT(EPOCH FROM (
                SELECT
                    qualification_end
                FROM distribution_info))
        GROUP BY
            sa.user_id,
            DATE(to_timestamp(sat.block_time) AT TIME ZONE 'UTC')
    ),
    streaks AS (
        SELECT
            user_id,
            transfer_date,
            unique_recipients,
            transfer_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date))::INTEGER AS streak_group
        FROM
            daily_transfers
        WHERE
            unique_recipients > 0
    ),
    max_streaks AS (
        SELECT
            user_id,
            MAX(streak_length) AS max_streak_length
        FROM (
            SELECT
                user_id,
                streak_group,
                COUNT(*) AS streak_length
            FROM
                streaks
            GROUP BY
                user_id,
                streak_group) AS streak_lengths
        GROUP BY
            user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        ms.user_id,
        'send_streak'::public.verification_type,
        (SELECT NOW() AT TIME ZONE 'UTC'),
        ms.max_streak_length
    FROM
        max_streaks ms
    WHERE
        ms.max_streak_length > 0;
END;
$$ LANGUAGE plpgsql;

-- Set created_at to the current UTC time only when existing created_at is in the future
-- with a 1-minute buffer for race conditions
UPDATE public.distribution_verifications
SET created_at = (SELECT NOW() AT TIME ZONE 'UTC')
WHERE type = 'send_streak'
AND distribution_id = (SELECT id FROM distributions WHERE number = 15)
AND created_at > (SELECT (NOW() AT TIME ZONE 'UTC') + INTERVAL '1 minutes');
