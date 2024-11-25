-- Round #8
-- 300m $send
-- Opens Oct 01th 00:00 UTC
-- Closes Oct 31st 11:59 UTC
-- 100k minimum
-- Create the eighth distribution
INSERT INTO public.distributions(
  number,
  name,
  description,
  amount,
  hodler_pool_bips,
  bonus_pool_bips,
  fixed_pool_bips,
  qualification_start,
  qualification_end,
  hodler_min_balance,
  claim_end,
  chain_id)
VALUES (
  8,
  'Distribution #8',
  'Eighth distributions of 300,000,000 SEND tokens to early hodlers',
  300000000,
  -- 300,000,000 SEND
  10000,
  0,
  10000,(
    SELECT
      '2024-10-01T00:00:00Z'::timestamp with time zone),
(
    SELECT
      '2024-11-01T00:00:00Z'::timestamp with time zone - interval '1 second'),
    --  300,000 SEND
    300000,('infinity'),
    8453 -- Base chain
);

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'tag_registration' ::public.verification_type,
  10000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'create_passkey' ::public.verification_type,
  10000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'send_ten' ::public.verification_type,
  50000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'send_one_hundred' ::public.verification_type,
  100000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  multiplier_max,
  multiplier_step,
  mode,
  distribution_id)
VALUES (
  'total_tag_referrals' ::public.verification_type,
  0,
  0,
  2.0,
  0.02,
  'aggregate',
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  multiplier_min,
  multiplier_max,
  multiplier_step,
  distribution_id)
VALUES (
  'tag_referral' ::public.verification_type,
  0,
  0,
  1.5,
  2.5,
  0.25,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  multiplier_max,
  multiplier_step,
  mode,
  distribution_id)
VALUES (
  'send_streak',
  1000,
  0,
  5.0,
  0.2,
  'aggregate',
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1));

-- Add create_passkey verifications for all existing Send accounts
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
      "number" = 8
    LIMIT 1) AS distribution_id,
sa.user_id,
'create_passkey'::public.verification_type AS type,
jsonb_build_object('account_created_at', sa.created_at) AS metadata,
LEAST(sa.created_at,(
    SELECT
      qualification_end
    FROM distributions
    WHERE
      "number" = 8 LIMIT 1)) AS created_at
FROM
  send_accounts sa
WHERE
  sa.created_at <=(
    SELECT
      qualification_end
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1);

-- Add existing tags to distribution_verifications
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
      "number" = 8
    LIMIT 1),
user_id,
'tag_registration'::public.verification_type,
jsonb_build_object('tag', "name"),
created_at
FROM
  tags
WHERE
  status = 'confirmed'::public.tag_status;

-- Add month referrals to distribution_verifications
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
      "number" = 8
    LIMIT 1),
referrer_id,
'tag_referral'::public.verification_type,
jsonb_build_object('referred_id', referred_id, 'tag', tag),
tags.created_at
FROM
  referrals
  JOIN tags ON tags.name = referrals.tag
WHERE
  created_at <(
    SELECT
      qualification_end
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1)
  AND created_at >(
    SELECT
      qualification_start
    FROM
      distributions
    WHERE
      "number" = 8
    LIMIT 1);

-- Add total_tag_referrals to distribution_verifications
INSERT INTO public.distribution_verifications(
  distribution_id,
  user_id,
  type,
  metadata,
  created_at)
WITH distribution_info AS (
  SELECT
    id,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 8
  LIMIT 1),
total_referrals AS (
  SELECT
    r.referrer_id,
    COUNT(*) AS total_referrals,
    MAX(t.created_at) AS last_referral_date
  FROM
    referrals r
    JOIN tags t ON t.name = r.tag
  WHERE
    t.created_at <=(
      SELECT
        qualification_end
      FROM
        distribution_info)
    GROUP BY
      r.referrer_id
)
SELECT
  (
    SELECT
      id
    FROM
      distribution_info) AS distribution_id,
  tr.referrer_id AS user_id,
  'total_tag_referrals'::public.verification_type AS type,
  jsonb_build_object('value', tr.total_referrals) AS metadata,
  LEAST(tr.last_referral_date,(
      SELECT
        qualification_end
      FROM distribution_info)) AS created_at
FROM
  total_referrals tr
WHERE
  tr.total_referrals > 0;

-- Add send_ten or send_one_hundred to distribution_verifications based on unique user transfers
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
    from_user_id AS user_id,
    COUNT(DISTINCT to_user_id) AS unique_recipient_count,
  MAX(created_at) AS last_transfer_date
FROM
  activity
  WHERE
    event_name = 'send_account_transfers'
    AND created_at >(
      SELECT
        qualification_start
      FROM
        distribution_info)
      AND created_at <(
        SELECT
          qualification_end
        FROM
          distribution_info)
        AND from_user_id IS NOT NULL
        AND to_user_id IS NOT NULL
      GROUP BY
        from_user_id)
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
      distribution_info),
  utc.user_id,
  verification_type,
  jsonb_build_object('value', utc.unique_recipient_count),
  LEAST(utc.last_transfer_date,(
      SELECT
        qualification_end
      FROM distribution_info))
FROM
  unique_transfer_counts utc
  CROSS JOIN LATERAL (
  VALUES ('send_ten'::public.verification_type),
('send_one_hundred'::public.verification_type)) AS v(verification_type)
WHERE (verification_type = 'send_ten'
  AND utc.unique_recipient_count >= 10)
  OR (verification_type = 'send_one_hundred'
    AND utc.unique_recipient_count >= 100)
  AND utc.user_id IS NOT NULL;

-- Add send_streak to distribution_verifications based on user activity
-- This assigns a sequential number to each row within each from_user_id partition.
-- The numbers are assigned in order of the transfer_date.
-- This is used to group the rows by from_user_id and transfer_date.
--     from_user_id | transfer_date | ROW_NUMBER() | streak_group
-- ----------------------------------------------------
-- user1        | 2023-10-01    | 1            | 2023-09-30
-- user1        | 2023-10-02    | 2            | 2023-09-30
-- user1        | 2023-10-03    | 3            | 2023-09-30
-- user1        | 2023-10-05    | 4            | 2023-10-01  <-- Gap, new streak group
-- user1        | 2023-10-06    | 5            | 2023-10-01
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
    from_user_id,
    DATE(created_at) AS transfer_date,
  COUNT(DISTINCT to_user_id) AS unique_recipients
FROM
  activity
  WHERE
    event_name = 'send_account_transfers'
    AND created_at >=(
      SELECT
        qualification_start
      FROM
        distribution_info)
      AND created_at <(
        SELECT
          qualification_end
        FROM
          distribution_info)
        AND from_user_id IS NOT NULL
      GROUP BY
        from_user_id,
        DATE(created_at)
),
streaks AS (
  SELECT
    from_user_id,
    transfer_date,
    unique_recipients,
    transfer_date -(ROW_NUMBER() OVER (PARTITION BY from_user_id ORDER BY transfer_date) - 1) * INTERVAL '1 day' AS streak_group
  FROM
    daily_transfers
  WHERE
    unique_recipients > 0
),
max_streaks AS (
  SELECT
    from_user_id,
    MAX(streak_length) AS max_streak_length
  FROM (
    SELECT
      from_user_id,
      streak_group,
      COUNT(*) AS streak_length
    FROM
      streaks
    GROUP BY
      from_user_id,
      streak_group) AS streak_lengths
GROUP BY
  from_user_id)
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
        distribution_info),
    ms.from_user_id,
    'send_streak'::public.verification_type,
    jsonb_build_object('value', ms.max_streak_length),
(
      SELECT
        qualification_end
      FROM
        distribution_info)
  FROM
    max_streaks ms
  WHERE
    ms.max_streak_length > 1;

