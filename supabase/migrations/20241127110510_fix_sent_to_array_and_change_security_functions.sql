ALTER FUNCTION sum_qualification_sends(integer) SECURITY DEFINER;

ALTER FUNCTION calculate_and_insert_send_ceiling_verification(integer) SECURITY DEFINER;

ALTER FUNCTION insert_verification_send_ceiling() SECURITY DEFINER;

-- First drop any dependent objects (like triggers) that use these functions
DROP TRIGGER IF EXISTS insert_verification_send_ceiling_trigger ON send_token_transfers;

-- Then drop functions in reverse dependency order
DROP FUNCTION IF EXISTS insert_verification_send_ceiling();

CREATE OR REPLACE FUNCTION insert_verification_send_ceiling()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $$
DECLARE
  _user_id uuid;
  _recipient_address citext;
  _distribution_id integer;
  _distribution_number integer;
  _send_ceiling numeric;
  _verification_exists boolean;
BEGIN
  -- Get the sender's user_id
  SELECT
    send_accounts.user_id INTO _user_id
  FROM
    send_accounts
  WHERE
    address = concat('0x', encode(NEW.f, 'hex'))::citext;
  -- Get recipient address
  _recipient_address := concat('0x', encode(NEW.t, 'hex'))::citext;
  -- Get the active distribution id and number
  SELECT
    d.id,
    d.number INTO _distribution_id,
    _distribution_number
  FROM
    distributions d
  WHERE
    extract(epoch FROM d.qualification_start) <= NEW.block_time
    AND extract(epoch FROM d.qualification_end) > NEW.block_time;
  -- If we found matching distribution and user
  IF _user_id IS NOT NULL AND _distribution_id IS NOT NULL THEN
    -- Check if verification exists
    SELECT
      EXISTS (
        SELECT
          1
        FROM
          distribution_verifications dv
        WHERE
          dv.user_id = _user_id
          AND distribution_id = _distribution_id
          AND type = 'send_ceiling') INTO _verification_exists;
    IF NOT _verification_exists THEN
      -- Calculate send ceiling
      WITH send_settings AS (
        SELECT
          minimum_sends * scaling_divisor AS divider
        FROM
          send_slash s_s
          JOIN distributions d ON d.id = s_s.distribution_id
        WHERE
          d.number = _distribution_number
),
previous_distribution AS (
  SELECT
    ds.user_id,
    ds.amount_after_slash AS user_prev_shares
  FROM
    distribution_shares ds
  WHERE
    ds.distribution_id =(
      SELECT
        id
      FROM
        distributions
      WHERE
        number = _distribution_number - 1)
      AND ds.user_id = _user_id
),
distribution_info AS (
  SELECT
    hodler_min_balance
  FROM
    distributions
  WHERE
    id = _distribution_id
)
SELECT
  ROUND(COALESCE(pd.user_prev_shares, di.hodler_min_balance) / ss.divider)::numeric INTO _send_ceiling
FROM
  distribution_info di
  CROSS JOIN send_settings ss
  LEFT JOIN previous_distribution pd ON pd.user_id = _user_id;
  -- Create new verification
  INSERT INTO distribution_verifications(
    distribution_id,
    user_id,
    type,
    weight,
    metadata)
  VALUES (
    _distribution_id,
    _user_id,
    'send_ceiling',
    LEAST(
      NEW.v, _send_ceiling),
    jsonb_build_object(
      'value', _send_ceiling, 'sent_to', ARRAY[_recipient_address] ::citext[]));
ELSE
  -- Get the send ceiling for existing verification
  SELECT
    (metadata ->> 'value')::numeric INTO _send_ceiling
  FROM
    distribution_verifications dv
  WHERE
    dv.user_id = _user_id
    AND distribution_id = _distribution_id
    AND type = 'send_ceiling';
  -- Update existing verification, only if this recipient hasn't been counted before
  UPDATE
    distribution_verifications dv
  SET
    metadata = jsonb_build_object('value', _send_ceiling, 'sent_to', metadata -> 'sent_to' || jsonb_build_array(_recipient_address)),
    weight = weight + LEAST(NEW.v, _send_ceiling)
  WHERE
    dv.user_id = _user_id
    AND distribution_id = _distribution_id
    AND type = 'send_ceiling';
END IF;
END IF;
  RETURN NEW;
END;
$$;

-- 4. Run recalculation
SELECT
  calculate_and_insert_send_ceiling_verification(9);

-- 5. Create trigger last
CREATE TRIGGER insert_verification_send_ceiling_trigger
  AFTER INSERT ON send_token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION insert_verification_send_ceiling();

