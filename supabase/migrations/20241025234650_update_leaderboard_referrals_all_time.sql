-- Update the referral leaderboard table with data from the referrals and sendtag_checkout_receipts tables
UPDATE
  private.leaderboard_referrals_all_time l
SET
  referrals = tmp.referrals,
  rewards_usdc = tmp.rewards_usdc,
  updated_at = now()
FROM (
  SELECT
    p.id AS user_id,
    coalesce(count(DISTINCT r.referred_id), 0) AS referrals,
    coalesce(sum(scr.reward), 0) AS rewards_usdc
  FROM
    profiles p
  LEFT JOIN send_accounts sa ON p.id = sa.user_id
  LEFT JOIN (
    SELECT
      referrer,
      sum(reward) AS reward
    FROM
      sendtag_checkout_receipts
    GROUP BY
      referrer) scr ON decode(substr(sa.address, 3), 'hex') = scr.referrer
  LEFT JOIN referrals r ON r.referrer_id = p.id
GROUP BY
  p.id
HAVING
  count(DISTINCT r.referred_id) > 0
  OR sum(scr.reward) > 0) AS tmp
WHERE
  l.user_id = tmp.user_id;

-- Insert new records for users not already in the leaderboard
INSERT INTO private.leaderboard_referrals_all_time(
  user_id,
  referrals,
  rewards_usdc,
  updated_at)
SELECT
  p.id AS user_id,
  coalesce(count(DISTINCT r.referred_id), 0) AS referrals,
  coalesce(sum(scr.reward), 0) AS rewards_usdc,
  now() AS updated_at
FROM
  profiles p
  LEFT JOIN send_accounts sa ON p.id = sa.user_id
  LEFT JOIN (
    SELECT
      referrer,
      sum(reward) AS reward
    FROM
      sendtag_checkout_receipts
    GROUP BY
      referrer) scr ON decode(substr(sa.address, 3), 'hex') = scr.referrer
  LEFT JOIN referrals r ON r.referrer_id = p.id
WHERE
  p.id NOT IN (
    SELECT
      user_id
    FROM
      private.leaderboard_referrals_all_time)
GROUP BY
  p.id
HAVING
  count(DISTINCT r.referred_id) > 0
  OR sum(scr.reward) > 0;

