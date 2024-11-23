DROP FUNCTION IF EXISTS get_affiliate_stats_summary();

CREATE OR REPLACE FUNCTION get_affiliate_stats_summary()
  RETURNS TABLE(
    id uuid,
    created_at timestamptz,
    user_id uuid,
    referral_count bigint)
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
    COUNT(DISTINCT r.tag)::bigint AS referral_count
  FROM
    affiliate_stats a
  LEFT JOIN referrals r ON r.referrer_id = a.user_id
WHERE
  a.user_id = auth.uid()
GROUP BY
  a.id,
  a.created_at,
  a.user_id;
END;
$$;

