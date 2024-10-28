-- For total_tag_referrals
WITH distribution_info AS (
  SELECT
    id,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 8
  LIMIT 1
),
total_referrals AS (
  SELECT
    r.referrer_id,
    COUNT(*) AS total_referrals,
  MAX(t.created_at) AS last_referral_date
FROM
  referrals r
  JOIN tags t ON t.name = r.tag
GROUP BY
  r.referrer_id
),
update_verifications AS (
  UPDATE
    public.distribution_verifications
  SET
    weight = tr.total_referrals,
    created_at = LEAST(tr.last_referral_date,(
        SELECT
          qualification_end
        FROM distribution_info))
  FROM
    total_referrals tr
  WHERE
    distribution_verifications.distribution_id =(
      SELECT
        id
      FROM
        distribution_info)
      AND distribution_verifications.user_id = tr.referrer_id
      AND distribution_verifications.type = 'total_tag_referrals'::public.verification_type
      AND tr.total_referrals > 0
    RETURNING
      distribution_verifications.user_id)
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    created_at,
    weight)
SELECT
  (
    SELECT
      id
    FROM
      distribution_info) AS distribution_id,
  tr.referrer_id AS user_id,
  'total_tag_referrals'::public.verification_type AS type,
  LEAST(tr.last_referral_date,(
      SELECT
        qualification_end
      FROM distribution_info)) AS created_at,
  tr.total_referrals AS weight
FROM
  total_referrals tr
WHERE
  tr.total_referrals > 0
  AND NOT EXISTS (
    SELECT
      1
    FROM
      update_verifications
    WHERE
      update_verifications.user_id = tr.referrer_id);

-- For send_ten and send_one_hundred
WITH distribution_info AS (
  SELECT
    id,
    qualification_start,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 8
  LIMIT 1
),
unique_transfer_counts AS (
  SELECT
    sa.user_id,
    COUNT(DISTINCT sat.t) AS unique_recipient_count,
  MAX(to_timestamp(sat.block_time) at time zone 'UTC') AS last_transfer_date
FROM
  send_account_transfers sat
  JOIN send_accounts sa ON sa.address = concat('0x', encode(sat.f, 'hex'))::citext
  WHERE
    sat.block_time >= extract(epoch FROM (
        SELECT
          qualification_start
        FROM distribution_info))
    AND sat.block_time < extract(epoch FROM (
        SELECT
          qualification_end
        FROM distribution_info))
  GROUP BY
    sa.user_id
),
update_verifications AS (
  UPDATE
    public.distribution_verifications
  SET
    metadata = jsonb_build_object('value', utc.unique_recipient_count),
    weight = CASE WHEN distribution_verifications.type = 'send_ten'::public.verification_type
      AND utc.unique_recipient_count >= 10 THEN
      1
    WHEN distribution_verifications.type = 'send_one_hundred'::public.verification_type
      AND utc.unique_recipient_count >= 100 THEN
      1
    ELSE
      0
    END,
    created_at = LEAST(utc.last_transfer_date,(
        SELECT
          qualification_end
        FROM distribution_info))
  FROM
    unique_transfer_counts utc
  WHERE
    distribution_verifications.distribution_id =(
      SELECT
        id
      FROM
        distribution_info)
      AND distribution_verifications.user_id = utc.user_id
      AND distribution_verifications.type IN ('send_ten'::public.verification_type, 'send_one_hundred'::public.verification_type)
    RETURNING
      distribution_verifications.user_id,
      distribution_verifications.type)
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    created_at,
    weight)
SELECT
  (
    SELECT
      id
    FROM
      distribution_info),
  utc.user_id,
  type,
  jsonb_build_object('value', utc.unique_recipient_count),
LEAST(utc.last_transfer_date,(
    SELECT
      qualification_end
    FROM distribution_info)),
CASE WHEN type = 'send_ten'::public.verification_type
  AND utc.unique_recipient_count >= 10 THEN
  1
WHEN type = 'send_one_hundred'::public.verification_type
  AND utc.unique_recipient_count >= 100 THEN
  1
ELSE
  0
END
FROM
  unique_transfer_counts utc
  CROSS JOIN (
    SELECT
      'send_ten'::public.verification_type AS type
  UNION ALL
  SELECT
    'send_one_hundred'::public.verification_type) types
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      update_verifications
    WHERE
      update_verifications.user_id = utc.user_id
      AND update_verifications.type = types.type);

-- For send_streak
WITH distribution_info AS (
  SELECT
    id,
    qualification_start,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 8
  LIMIT 1
),
daily_transfers AS (
  SELECT
    sa.user_id,
    DATE(to_timestamp(sat.block_time) at time zone 'UTC') AS transfer_date,
  COUNT(DISTINCT sat.t) AS unique_recipients
FROM
  send_account_transfers sat
  JOIN send_accounts sa ON sa.address = concat('0x', encode(sat.f, 'hex'))::citext
  WHERE
    sat.block_time >= extract(epoch FROM (
        SELECT
          qualification_start
        FROM distribution_info))
    AND sat.block_time < extract(epoch FROM (
        SELECT
          qualification_end
        FROM distribution_info))
  GROUP BY
    sa.user_id,
    DATE(to_timestamp(sat.block_time) at time zone 'UTC')
),
streaks AS (
  SELECT
    user_id,
    transfer_date,
    unique_recipients,
    transfer_date -(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date) - 1) * INTERVAL '1 day' AS streak_group
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
),
update_verifications AS (
  UPDATE
    public.distribution_verifications
  SET
    weight = ms.max_streak_length,
    created_at =(
      SELECT
        qualification_end
      FROM
        distribution_info)
    FROM
      max_streaks ms
    WHERE
      distribution_verifications.distribution_id =(
        SELECT
          id
        FROM
          distribution_info)
        AND distribution_verifications.user_id = ms.user_id
        AND distribution_verifications.type = 'send_streak'::public.verification_type
        AND ms.max_streak_length > 1
      RETURNING
        distribution_verifications.user_id)
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    created_at,
    weight)
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
  ms.max_streak_length > 1
  AND NOT EXISTS (
    SELECT
      1
    FROM
      update_verifications
    WHERE
      update_verifications.user_id = ms.user_id);

