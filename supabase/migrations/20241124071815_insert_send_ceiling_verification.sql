INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id)
VALUES (
  'send_ceiling' ::public.verification_type,
  0,
  0,
(
    SELECT
      id
    FROM
      distributions
    WHERE
      number = 9));

CREATE OR REPLACE FUNCTION sum_qualification_sends(distribution_number integer, send_ceiling numeric)
  RETURNS TABLE(
    user_id uuid,
    amount numeric,
    sent_to citext[])
  LANGUAGE plpgsql
  AS $$
BEGIN
  -- Create temporary table to store qualification period
  CREATE TEMPORARY TABLE IF NOT EXISTS qual_period AS
  SELECT
    extract(epoch FROM qualification_start) AS start_time,
    extract(epoch FROM qualification_end) AS end_time
  FROM
    distributions
  WHERE
    number = distribution_number;
  -- Create temporary table for first sends to each address
  CREATE TEMPORARY TABLE first_sends AS SELECT DISTINCT ON(sa.user_id, concat('0x', encode(stt.t, 'hex')
)::citext) sa.user_id,
  concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
  LEAST(stt.v, send_ceiling) AS capped_amount,
  stt.block_time
FROM
  send_token_transfers stt
  JOIN send_accounts sa ON sa.address = concat('0x', encode(stt.f, 'hex'))::citext
  CROSS JOIN qual_period qp
WHERE
  stt.block_time >= qp.start_time
    AND stt.block_time < qp.end_time
  ORDER BY
    sa.user_id,
    concat('0x', encode(stt.t, 'hex'))::citext,
    stt.block_time;
  -- Create index for performance
  CREATE INDEX ON first_sends(user_id);
  -- Return aggregated results
  RETURN QUERY
  SELECT
    fs.user_id,
    SUM(fs.capped_amount) AS amount,
    array_agg(fs.recipient) AS sent_to
  FROM
    first_sends fs
  GROUP BY
    fs.user_id;
  -- Cleanup
  DROP TABLE IF EXISTS qual_period;
  DROP TABLE IF EXISTS first_sends;
END;
$$;

CREATE TEMPORARY TABLE send_ceiling_settings AS
WITH send_settings AS (
  SELECT
    minimum_sends * scaling_divisor AS divider
  FROM
    send_slash
  WHERE
    distribution_number = 9
),
previous_distribution AS (
  SELECT
    ds.user_id,
    ds.amount AS user_prev_shares
  FROM
    distribution_shares ds
  WHERE
    ds.distribution_id =(
      SELECT
        id
      FROM
        distributions d
      WHERE
        d.number = 8))
SELECT
  pd.user_id,
  ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) / ss.divider)::numeric AS send_ceiling
FROM
  distributions d
  CROSS JOIN send_settings ss
  LEFT JOIN previous_distribution pd ON TRUE
WHERE
  d.number = 9;

CREATE TEMPORARY TABLE all_qualifying_sends AS
SELECT
  *
FROM
  sum_qualification_sends(9,(
      SELECT
        MAX(send_ceiling)
      FROM send_ceiling_settings));

CREATE OR REPLACE FUNCTION calculate_and_insert_send_ceiling_verification(distribution_number integer)
  RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  -- Use existing temporary send_ceiling_settings and all_qualifying_sends tables
  INSERT INTO distribution_verifications(
    distribution_id,
    user_id,
    type,
    weight,
    metadata)
  SELECT
(
      SELECT
        id
      FROM
        distributions d
      WHERE
        d.number = $1), qs.user_id, 'send_ceiling'::public.verification_type, LEAST(qs.amount, scs.send_ceiling), jsonb_build_object('value', scs.send_ceiling, 'sent_to', qs.sent_to)
  FROM
    send_ceiling_settings scs
    JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
  WHERE
    COALESCE(qs.amount, 0) > 0;
END;
$$;

SELECT
  calculate_and_insert_send_ceiling_verification(9);

-- Cleanup temporary tables
DROP TABLE IF EXISTS send_ceiling_settings;

DROP TABLE IF EXISTS all_qualifying_sends;

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
    user_id INTO _user_id
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
          distribution_verifications
        WHERE
          user_id = _user_id
          AND distribution_id = _distribution_id
          AND type = 'send_ceiling') INTO _verification_exists;
    IF NOT _verification_exists THEN
      -- Get send ceiling from calculation
      WITH send_settings AS (
        SELECT
          minimum_sends * scaling_divisor AS divider
        FROM
          send_slash
        WHERE
          distribution_number = _distribution_number
),
previous_distribution AS (
  SELECT
    ds.amount AS user_prev_shares
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
  LEFT JOIN previous_distribution pd ON TRUE;
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
      'value', _send_ceiling, 'sent_to', ARRAY[_recipient_address]));
ELSE
  -- Get the send ceiling for existing verification
  SELECT
    (metadata ->> 'value')::numeric INTO _send_ceiling
  FROM
    distribution_verifications
  WHERE
    user_id = _user_id
    AND distribution_id = _distribution_id
    AND type = 'send_ceiling';
  -- Update existing verification
  UPDATE
    distribution_verifications
  SET
    metadata = jsonb_set(metadata, '{sent_to}', to_jsonb(array_append(COALESCE(metadata -> 'sent_to'::citext[], ARRAY[]::citext[]), _recipient_address))),
    weight = weight + LEAST(NEW.v, _send_ceiling)
  WHERE
    user_id = _user_id
    AND distribution_id = _distribution_id
    AND type = 'send_ceiling'
    AND NOT (_recipient_address = ANY (metadata -> 'sent_to'::citext[]));
END IF;
END IF;
  RETURN NEW;
END;
$$;

-- Add trigger
CREATE TRIGGER insert_verification_send_ceiling_trigger
  AFTER INSERT ON send_token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION insert_verification_send_ceiling();

-- Revoke execute from all roles for sum_qualification_sends
REVOKE EXECUTE ON FUNCTION "public"."sum_qualification_sends"(integer, numeric) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."sum_qualification_sends"(integer, numeric) FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."sum_qualification_sends"(integer, numeric) FROM authenticated;

-- Revoke execute from all roles for calculate_and_insert_send_ceiling_verification
REVOKE EXECUTE ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"(integer) FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"(integer) FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."calculate_and_insert_send_ceiling_verification"(integer) FROM authenticated;

-- Revoke execute from all roles for update_send_ceiling_verification
REVOKE EXECUTE ON FUNCTION "public"."insert_verification_send_ceiling"() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."insert_verification_send_ceiling"() FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."insert_verification_send_ceiling"() FROM authenticated;

