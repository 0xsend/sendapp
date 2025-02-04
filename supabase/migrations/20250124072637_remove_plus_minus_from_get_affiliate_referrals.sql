DROP FUNCTION IF EXISTS get_affiliate_referrals();

CREATE OR REPLACE FUNCTION get_affiliate_referrals()
  RETURNS TABLE(
    referred_id uuid,
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
  o.avatar_url,
  o.tag,
  o.created_at
FROM
  ordered_referrals o
ORDER BY
  send_score DESC;
END;
$$;

