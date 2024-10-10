-- Round #7
-- 300m $send
-- Opens Sept 01th 00:00 UTC
-- Closes Sept 30th 11:59 UTC
-- 100k minimum
-- Create the seventh distribution
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
  chain_id,
  snapshot_block_num)
VALUES (
  7,
  'Distribution #7',
  'Seventh distributions of 300,000,000 SEND tokens to early hodlers',
  300000000,
  -- 300,000,000 SEND
  10000,
  0,
  10000,(
    SELECT
      '2024-09-01T00:00:00Z'::timestamp with time zone),
(
    SELECT
      '2024-10-01T00:00:00Z'::timestamp with time zone - interval '1 second'),
    --  100,000 SEND
    100000,('infinity'),
    8453, -- Base chain
    20475726 -- Sept 30 11:59:59 UTC
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
      "number" = 7
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'create_passkey' ::public.verification_type,
  50000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 7
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'send_ten' ::public.verification_type,
  100000,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 7
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
      "number" = 7
    LIMIT 1));

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id,
  multiplier_min,
  multiplier_max,
  multiplier_step)
VALUES (
  'total_tag_referrals' ::public.verification_type,
  0,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 7
    LIMIT 1),
  1.0,
  5.0,
  0.05);

INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id,
  multiplier_min,
  multiplier_max,
  multiplier_step)
VALUES (
  'tag_referral' ::public.verification_type,
  0,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 7
    LIMIT 1),
  1.5,
  5,
  0.25);

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
      "number" = 7
    LIMIT 1) AS distribution_id,
sa.user_id,
'create_passkey'::public.verification_type AS type,
jsonb_build_object('account_created_at', sa.created_at) AS metadata,
LEAST(sa.created_at,(
    SELECT
      qualification_end
    FROM distributions
    WHERE
      "number" = 7 LIMIT 1)) AS created_at
FROM
  send_accounts sa
WHERE
  sa.created_at <=(
    SELECT
      qualification_end
    FROM
      distributions
    WHERE
      "number" = 7
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
      "number" = 7
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
      "number" = 7
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
      "number" = 7
    LIMIT 1)
  AND created_at >(
    SELECT
      qualification_start
    FROM
      distributions
    WHERE
      "number" = 7
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
    "number" = 7
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

-- Add send_ten or send_one_hundred to distribution_verifications based on user activity
INSERT INTO public.distribution_verifications(
  distribution_id,
  user_id,
  type,
  metadata,
  created_at)
WITH distribution_info AS (
  SELECT
    id,
    qualification_start,
    qualification_end
  FROM
    distributions
  WHERE
    "number" = 7
  LIMIT 1),
transfer_counts AS (
  SELECT
    from_user_id AS user_id,
    COUNT(*) AS transfer_count,
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
        AND from_user_id IS NOT NULL -- Add this line
      GROUP BY
        from_user_id
)
  SELECT
    (
      SELECT
        id
      FROM
        distribution_info) AS distribution_id,
    tc.user_id,
    CASE WHEN tc.transfer_count >= 100 THEN
      'send_one_hundred'::public.verification_type
    WHEN tc.transfer_count >= 10 THEN
      'send_ten'::public.verification_type
    END AS type,
    jsonb_build_object('transfer_count', tc.transfer_count) AS metadata,
  LEAST(tc.last_transfer_date,(
      SELECT
        qualification_end
      FROM distribution_info)) AS created_at
FROM
  transfer_counts tc
WHERE
  tc.transfer_count >= 10
  AND tc.user_id IS NOT NULL;

