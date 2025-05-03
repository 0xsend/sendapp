-- Function to add verification values with clean parameter names and defaults
CREATE OR REPLACE FUNCTION insert_verification_value(
    distribution_number INT,
    type public.verification_type,
    fixed_value NUMERIC DEFAULT NULL,
    bips_value INT DEFAULT NULL,
    multiplier_min NUMERIC DEFAULT NULL,
    multiplier_max NUMERIC DEFAULT NULL,
    multiplier_step NUMERIC DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    prev_verification_values RECORD;
BEGIN
    SELECT * INTO prev_verification_values
    FROM public.distribution_verification_values dvv
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number - 1 LIMIT 1)
    AND dvv.type = insert_verification_value.type
    LIMIT 1;

    INSERT INTO public.distribution_verification_values(
        type,
        fixed_value,
        bips_value,
        multiplier_min,
        multiplier_max,
        multiplier_step,
        distribution_id
    ) VALUES (
        insert_verification_value.type,
        COALESCE(insert_verification_value.fixed_value, prev_verification_values.fixed_value, 0),
        COALESCE(insert_verification_value.bips_value, prev_verification_values.bips_value, 0),
        COALESCE(insert_verification_value.multiplier_min, prev_verification_values.multiplier_min),
        COALESCE(insert_verification_value.multiplier_max, prev_verification_values.multiplier_max),
        COALESCE(insert_verification_value.multiplier_step, prev_verification_values.multiplier_step),
        (SELECT id FROM distributions WHERE "number" = insert_verification_value.distribution_number LIMIT 1)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to add send slash details with clean parameter names and defaults
CREATE OR REPLACE FUNCTION insert_send_slash(
    distribution_number INT,
    scaling_divisor INT DEFAULT NULL,
    minimum_sends INT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    prev_send_slash RECORD;
BEGIN
    -- Retrieve the previous send_slash record
    SELECT * INTO prev_send_slash
    FROM public.send_slash
    WHERE distribution_id = (SELECT id FROM distributions WHERE "number" = insert_send_slash.distribution_number - 1 LIMIT 1);

    -- Use provided values or previous values or defaults
    INSERT INTO public.send_slash(
        distribution_id,
        distribution_number,
        scaling_divisor,
        minimum_sends
    ) VALUES (
        (SELECT id FROM distributions WHERE "number" = distribution_number LIMIT 1),
        insert_send_slash.distribution_number,
        COALESCE(scaling_divisor, prev_send_slash.scaling_divisor, 3),
        COALESCE(minimum_sends, prev_send_slash.minimum_sends, 50)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_create_passkey_verifications(distribution_num integer)
RETURNS void AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at)
    SELECT
        (
            SELECT
                id
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1) AS distribution_id,
        sa.user_id,
        'create_passkey'::public.verification_type AS type,
        jsonb_build_object('account_created_at', sa.created_at) AS metadata,
        sa.created_at AS created_at
    FROM
        send_accounts sa
    WHERE
        sa.created_at >= (
            SELECT
                qualification_start
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        )
        AND sa.created_at <= (
            SELECT
                qualification_end
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1
        );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_tag_registration_verifications(distribution_num integer)
RETURNS void AS $$
BEGIN
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at)
    SELECT
        (
            SELECT
                id
            FROM
                distributions
            WHERE
                "number" = distribution_num
            LIMIT 1),
        user_id,
        'tag_registration'::public.verification_type,
        jsonb_build_object('tag', "name"),
        created_at
    FROM
        tags
    WHERE
        status = 'confirmed'::public.tag_status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_tag_referral_verifications(distribution_num integer)
RETURNS void AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_start timestamp;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_start, qualification_end INTO dist_id, qual_start, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add month referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    created_at,
    weight)
  SELECT
    dist_id,
    referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object('referred_id', referred_id),
    referrals.created_at,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = referrals.referred_id
          AND ds.distribution_id = prev_dist_id
      ) THEN 1
      ELSE 0
    END
  FROM
    referrals
  WHERE
    referrals.created_at < qual_end
    AND referrals.created_at > qual_start;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION insert_total_referral_verifications(distribution_num integer)
RETURNS void AS $$
DECLARE
  dist_id integer;
  prev_dist_id integer;
  qual_end timestamp;
BEGIN
  -- Get current distribution data once
  SELECT id, qualification_end INTO dist_id, qual_end
  FROM distributions
  WHERE "number" = distribution_num
  LIMIT 1;

  -- Get previous distribution ID once
  SELECT id INTO prev_dist_id
  FROM distributions
  WHERE "number" = distribution_num - 1
  LIMIT 1;

  -- Add total_tag_referrals to distribution_verifications
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    created_at,
    weight)
  WITH total_referrals AS (
    SELECT
      r.referrer_id,
      COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = r.referred_id
        AND ds.distribution_id = prev_dist_id
      )) AS qualified_referrals,
      MAX(r.created_at) AS last_referral_date
    FROM
      referrals r
    WHERE
      r.created_at <= qual_end
    GROUP BY
      r.referrer_id
  )
  SELECT
    dist_id AS distribution_id,
    tr.referrer_id AS user_id,
    'total_tag_referrals'::public.verification_type AS type,
    LEAST(tr.last_referral_date, qual_end) AS created_at,
    tr.qualified_referrals AS weight
  FROM
    total_referrals tr
  WHERE
    tr.qualified_referrals > 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.insert_send_verifications(distribution_num integer)
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
    unique_transfer_counts AS (
        SELECT
            sa.user_id,
            COUNT(DISTINCT sat.t) AS unique_recipient_count,
            MAX(to_timestamp(sat.block_time) AT TIME ZONE 'UTC') AS last_transfer_date
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
            sa.user_id
    )
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        created_at,
        weight
    )
    SELECT
        (
            SELECT
                id
            FROM
                distribution_info),
        utc.user_id,
        type,
        JSONB_BUILD_OBJECT('value', utc.unique_recipient_count),
        LEAST(utc.last_transfer_date, (
            SELECT
                qualification_end
            FROM distribution_info)),
        CASE
            WHEN type = 'send_ten'::public.verification_type
                AND utc.unique_recipient_count >= 10 THEN 1
            WHEN type = 'send_one_hundred'::public.verification_type
                AND utc.unique_recipient_count >= 100 THEN 1
            ELSE 0
        END
    FROM
        unique_transfer_counts utc
        CROSS JOIN (
            SELECT 'send_ten'::public.verification_type AS type
            UNION ALL
            SELECT 'send_one_hundred'::public.verification_type
        ) types;
END;
$$ LANGUAGE plpgsql;

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
        (
            SELECT
                qualification_end
            FROM
                distribution_info),
        ms.max_streak_length
    FROM
        max_streaks ms
    WHERE
        ms.max_streak_length > 0;
END;
$$ LANGUAGE plpgsql;
