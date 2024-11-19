-- Drop old column
ALTER TABLE affiliate_stats
  DROP COLUMN paymaster_tx_count;

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS after_activity_insert_update_affiliate_stats ON public.activity;

DROP FUNCTION IF EXISTS public.update_affiliate_stats_on_activity_insert();

ALTER TABLE affiliate_stats
  ADD COLUMN send_plus_minus bigint NOT NULL DEFAULT 0;

-- Policy for referrals table
CREATE POLICY "Users can see referrals they've made" ON referrals
  FOR SELECT
    USING (referrer_id = auth.uid() -- User can see referrals where they are the referrer
);

CREATE POLICY "Users can see own and referrals affiliate stats" ON affiliate_stats
  FOR SELECT
    USING (user_id = auth.uid()
      OR -- Can see own stats
      EXISTS ( -- Can see stats of users they've referred
        SELECT
          1
        FROM
          referrals
        WHERE
          referrer_id = auth.uid() AND referred_id = affiliate_stats.user_id));

CREATE OR REPLACE FUNCTION initialize_send_plus_minus()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
BEGIN
  UPDATE
    affiliate_stats a
  SET
    send_plus_minus =( WITH sent_amount AS(
        SELECT
          COALESCE(SUM(stt.v::numeric), 0) AS total
        FROM
          send_token_transfers stt
          INNER JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
        WHERE
          sa.user_id = a.user_id),
        received_amount AS(
          SELECT
            COALESCE(SUM(stt.v::numeric), 0) AS total
          FROM
            send_token_transfers stt
            INNER JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.t, 'hex'))::citext
            LEFT JOIN referrals r ON r.referrer_id = sa.user_id
          WHERE
            sa.user_id = a.user_id
            AND concat('0x', encode(stt.f, 'hex'))::citext NOT IN(
              SELECT
                sa2.address
              FROM
                send_accounts sa2
                INNER JOIN referrals r2 ON r2.referrer_id = sa2.user_id
              WHERE
                r2.referred_id = a.user_id))
            SELECT
(
                SELECT
                  total
                FROM
                  sent_amount) -(
                  SELECT
                    total
                  FROM
                    received_amount));
END;
$$;

-- Execute the function
SELECT
  initialize_send_plus_minus();

-- Drop the function after use
DROP FUNCTION initialize_send_plus_minus();

CREATE OR REPLACE FUNCTION public.update_affiliate_stats_on_transfer()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
  sender_id uuid;
  receiver_id uuid;
  transfer_amount numeric;
BEGIN
  -- Get sender and receiver user_ids
  SELECT
    sa.user_id INTO sender_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.f, 'hex'))::citext;
  SELECT
    sa.user_id INTO receiver_id
  FROM
    send_accounts sa
  WHERE
    sa.address = concat('0x', encode(NEW.t, 'hex'))::citext;
  transfer_amount := NEW.v::numeric;
  -- Update sender's stats (now increment)
  IF sender_id IS NOT NULL THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = sender_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus + transfer_amount
    WHERE
      user_id = sender_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      sender_id,
      transfer_amount);
  END IF;
END IF;
  -- Update receiver's stats (now decrement) if not from referrer
  IF receiver_id IS NOT NULL THEN
    -- Check if sender is not the receiver's referrer
    IF NOT EXISTS (
      SELECT
        1
      FROM
        referrals r
        INNER JOIN send_accounts sa ON sa.user_id = r.referrer_id
      WHERE
        r.referred_id = receiver_id
        AND sa.address = concat('0x', encode(NEW.f, 'hex'))::citext) THEN
    IF EXISTS (
      SELECT
        1
      FROM
        affiliate_stats
      WHERE
        user_id = receiver_id) THEN
    UPDATE
      affiliate_stats
    SET
      send_plus_minus = send_plus_minus - transfer_amount
    WHERE
      user_id = receiver_id;
  ELSE
    INSERT INTO affiliate_stats(
      user_id,
      send_plus_minus)
    VALUES (
      receiver_id,
      - transfer_amount);
  END IF;
END IF;
END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER after_transfer_update_affiliate_stats
  AFTER INSERT ON send_token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats_on_transfer();

CREATE TYPE affiliate_stats_summary_type AS (
  id bigint,
  created_at timestamptz,
  user_id uuid,
  send_plus_minus bigint,
  referral_count bigint,
  network_plus_minus numeric,
  affiliate_send_score numeric
);

CREATE OR REPLACE VIEW affiliate_stats_summary AS
SELECT
  a.id,
  a.created_at,
  a.user_id,
  a.send_plus_minus,
  COUNT(r.referred_id) AS referral_count,
  COALESCE(SUM(ra.send_plus_minus), 0) AS network_plus_minus,
  COALESCE((
    SELECT
      SUM(amount)
    FROM distribution_shares
    WHERE
      user_id = a.user_id
      AND distribution_id >= 6), 0) + COALESCE(SUM(ds.amount), 0) AS affiliate_send_score
FROM
  affiliate_stats a
  LEFT JOIN referrals r ON r.referrer_id = a.user_id
  LEFT JOIN affiliate_stats ra ON ra.user_id = r.referred_id
  LEFT JOIN distribution_shares ds ON ds.user_id = r.referred_id
    AND distribution_id >= 6
WHERE
  a.user_id = auth.uid()
GROUP BY
  a.id,
  a.created_at,
  a.user_id,
  a.send_plus_minus;

CREATE TYPE affiliate_referral_type AS (
  referred_id uuid,
  send_plus_minus numeric,
  avatar_url text,
  tag text,
  created_at timestamptz
);

CREATE OR REPLACE VIEW affiliate_referrals AS
WITH ordered_referrals AS (
  SELECT
    r.referred_id,
    COALESCE(a.send_plus_minus, 0) AS send_plus_minus,
    p.avatar_url,
    t.name AS tag,
    t.created_at,
    COALESCE((
      SELECT
        SUM(amount)
      FROM distribution_shares
      WHERE
        user_id = r.referred_id
        AND distribution_id >= 6), 0) AS send_score -- Include for ordering only
  FROM
    referrals r
    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
    LEFT JOIN profiles p ON p.id = r.referred_id
    LEFT JOIN tags t ON t.name = r.tag
  WHERE
    r.referrer_id = auth.uid()
  ORDER BY
    send_score DESC
)
SELECT
  (referred_id,
    send_plus_minus,
    avatar_url,
    tag,
    created_at)::affiliate_referral_type AS referral
FROM
  ordered_referrals;

