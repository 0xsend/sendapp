-- Round #9
-- 300m $send
-- Opens Nov 01st 00:00 UTC
-- Closes Nov 30th 23:59 UTC
-- 300k minimum
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
  9,
  'Distribution #9',
  'Ninth distribution of 400,000,000 SEND tokens to early hodlers',
  400000000, -- 400,000,000 SEND
  10000,
  0,
  10000,
  '2024-11-01T00:00:00Z' ::timestamp with time zone,
  '2024-12-01T00:00:00Z' ::timestamp with time zone - interval '1 second',
  300000, -- 300,000 SEND
  'infinity',
  8453 -- Base chain
);

-- Add verification values
INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  multiplier_min,
  multiplier_max,
  multiplier_step,
  distribution_id)
SELECT
  type,
  fixed_value,
  bips_value,
  multiplier_min,
  multiplier_max,
  multiplier_step,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      number = 9)
FROM
  distribution_verification_values
WHERE
  distribution_id =(
    SELECT
      id
    FROM
      distributions
    WHERE
      number = 8)
  AND type IN ('tag_registration', 'create_passkey', 'send_ten', 'send_one_hundred', 'tag_referral', 'send_streak');

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  multiplier_min,
  multiplier_max,
  multiplier_step,
  distribution_id)
VALUES (
  'total_tag_referrals' ::public.verification_type,
  0,
  0,
  1.02,
  2.0,
  0.02,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 9
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
      "number" = 9
    LIMIT 1) AS distribution_id,
sa.user_id,
'create_passkey'::public.verification_type AS type,
jsonb_build_object('account_created_at', sa.created_at) AS metadata,
LEAST(sa.created_at,(
    SELECT
      qualification_end
    FROM distributions
    WHERE
      "number" = 9 LIMIT 1)) AS created_at
FROM
  send_accounts sa
WHERE
  sa.created_at <=(
    SELECT
      qualification_end
    FROM
      distributions
    WHERE
      "number" = 9
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
      "number" = 9
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
      "number" = 9
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
      "number" = 9
    LIMIT 1)
  AND created_at >(
    SELECT
      qualification_start
    FROM
      distributions
    WHERE
      "number" = 9
    LIMIT 1);

-- Add total_tag_referrals to distribution_verifications
WITH distribution_info AS (
  SELECT
    id,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 9
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
  WHERE
    t.created_at <=(
      SELECT
        qualification_end
      FROM
        distribution_info)
    GROUP BY
      r.referrer_id)
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
        distribution_info) AS distribution_id,
    tr.referrer_id AS user_id,
    'total_tag_referrals'::public.verification_type AS type,
    jsonb_build_object('value', tr.total_referrals) AS metadata,
  LEAST(tr.last_referral_date,(
      SELECT
        qualification_end
      FROM distribution_info)) AS created_at,
  tr.total_referrals AS weight
FROM
  total_referrals tr
WHERE
  tr.total_referrals > 0;

-- For send_ten and send_one_hundred
WITH distribution_info AS (
  SELECT
    id,
    qualification_start,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 9
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
    sa.user_id)
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
    'send_one_hundred'::public.verification_type) types;

-- For send_streak
WITH distribution_info AS (
  SELECT
    id,
    qualification_start,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 9
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
    transfer_date -(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY transfer_date))::integer AS streak_group
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
  user_id)
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
    ms.max_streak_length > 0;
