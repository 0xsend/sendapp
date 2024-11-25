CREATE OR REPLACE FUNCTION get_affiliate_stats_summary()
  RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    user_id uuid,
    send_plus_minus bigint,
    referral_count bigint,
    network_plus_minus numeric,
    affiliate_send_score numeric)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.created_at,
    a.user_id,
    a.send_plus_minus,
    COUNT(r.referred_id)::bigint AS referral_count,
    COALESCE(SUM(ra.send_plus_minus), 0) AS network_plus_minus,
(COALESCE((
        SELECT
          SUM(amount)
        FROM distribution_shares ds2
        WHERE
          ds2.user_id = a.user_id
          AND ds2.distribution_id >= 6), 0) + COALESCE(SUM(ds.amount), 0)) AS affiliate_send_score
FROM
  affiliate_stats a
  LEFT JOIN referrals r ON r.referrer_id = a.user_id
  LEFT JOIN affiliate_stats ra ON ra.user_id = r.referred_id
  LEFT JOIN distribution_shares ds ON ds.user_id = r.referred_id
    AND ds.distribution_id >= 6
WHERE
  a.user_id = auth.uid()
GROUP BY
  a.id,
  a.created_at,
  a.user_id,
  a.send_plus_minus;
END;
$$;

CREATE OR REPLACE FUNCTION get_affiliate_referrals()
  RETURNS TABLE(
    referred_id uuid,
    send_plus_minus bigint,
    avatar_url text,
    tag citext,
    created_at timestamptz)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  RETURN QUERY WITH ordered_referrals AS(
    SELECT
      r.referred_id,
      COALESCE(a.send_plus_minus, 0)::bigint AS send_plus_minus,
      p.avatar_url,
      t.name AS tag,
      t.created_at,
      COALESCE((
        SELECT
          SUM(amount)
        FROM distribution_shares ds
        WHERE
          ds.user_id = r.referred_id
          AND distribution_id >= 6), 0) AS send_score
  FROM
    referrals r
    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
    LEFT JOIN profiles p ON p.id = r.referred_id
    LEFT JOIN tags t ON t.name = r.tag
  WHERE
    r.referrer_id = auth.uid())
SELECT
  o.referred_id,
  o.send_plus_minus,
  o.avatar_url,
  o.tag,
  o.created_at
FROM
  ordered_referrals o
ORDER BY
  send_score DESC;
END;
$$;

