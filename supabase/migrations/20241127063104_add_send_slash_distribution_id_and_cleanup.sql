-- First drop the existing foreign key constraint
ALTER TABLE "public"."send_slash"
  DROP CONSTRAINT "send_slash_distribution_number_fkey";

-- Add new distribution_id column
ALTER TABLE "public"."send_slash"
  ADD COLUMN "distribution_id" integer;

-- Copy data by joining with distributions
UPDATE
  "public"."send_slash" ss
SET
  distribution_id = d.id
FROM
  distributions d
WHERE
  d.number = ss.distribution_number;

ALTER TABLE public.send_slash
  ALTER COLUMN distribution_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "public"."send_slash"
  ADD CONSTRAINT "send_slash_distribution_id_fkey" FOREIGN KEY ("distribution_id") REFERENCES "public"."distributions"("id") ON DELETE CASCADE;

-- Enable read access to send_slash table
CREATE POLICY "Enable read access for all users" ON "public"."send_slash"
  FOR SELECT
    USING (TRUE);

-- First drop any dependent objects (like triggers) that use these functions
DROP TRIGGER IF EXISTS insert_verification_send_ceiling_trigger ON send_token_transfers;

-- Then drop functions in reverse dependency order
DROP FUNCTION IF EXISTS insert_verification_send_ceiling();

DROP FUNCTION IF EXISTS calculate_and_insert_send_ceiling_verification(integer);

DROP FUNCTION IF EXISTS sum_qualification_sends(integer);

-- Drop the old sum_qualification_sends function
DROP FUNCTION IF EXISTS sum_qualification_sends(integer, numeric);

CREATE OR REPLACE FUNCTION sum_qualification_sends(distribution_number integer)
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
    number = $1;
  -- Create temporary table for first sends to each address
  CREATE TEMPORARY TABLE first_sends AS SELECT DISTINCT ON(sa.user_id, concat('0x', encode(stt.t, 'hex')
)::citext) sa.user_id,
  concat('0x', encode(stt.t, 'hex'))::citext AS recipient,
  stt.v AS send_amount, -- Store full amount, will cap later
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
  -- Create send_ceiling_settings table
  CREATE TEMPORARY TABLE send_ceiling_settings AS
  WITH previous_distribution AS(
    SELECT
      ds.user_id,
      ds.amount AS user_prev_shares
    FROM
      distribution_shares ds
      JOIN distributions d ON d.id = ds.distribution_id
    WHERE
      d.number = $1 - 1
)
  SELECT
    fs.user_id,
    ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) /(
        SELECT
          minimum_sends * scaling_divisor
        FROM send_slash s_s
        WHERE
          s_s.distribution_id =(
            SELECT
              id
            FROM distributions
          WHERE
            number = $1)))::numeric AS send_ceiling
  FROM( SELECT DISTINCT
      first_sends.user_id
    FROM
      first_sends) fs
  CROSS JOIN(
    SELECT
      hodler_min_balance
    FROM
      distributions
    WHERE
      number = $1) d
  LEFT JOIN previous_distribution pd ON pd.user_id = fs.user_id;
  -- Return aggregated results with per-user send ceiling
  RETURN QUERY
  SELECT
    fs.user_id,
    SUM(LEAST(fs.send_amount, scs.send_ceiling)) AS amount,
    array_agg(fs.recipient) AS sent_to
  FROM
    first_sends fs
    JOIN send_ceiling_settings scs ON fs.user_id = scs.user_id
  GROUP BY
    fs.user_id;
  -- Cleanup
  DROP TABLE IF EXISTS qual_period;
  DROP TABLE IF EXISTS first_sends;
  DROP TABLE IF EXISTS send_ceiling_settings;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_and_insert_send_ceiling_verification(distribution_number integer)
  RETURNS void
  LANGUAGE plpgsql
  AS $$
BEGIN
  -- Step 1: Get qualifying sends first
  CREATE TEMPORARY TABLE all_qualifying_sends AS
  SELECT
    *
  FROM
    sum_qualification_sends($1);
  CREATE TEMPORARY TABLE send_ceiling_settings AS
  WITH send_settings AS(
    SELECT
      minimum_sends * scaling_divisor AS divider
    FROM
      send_slash s_s
      JOIN distributions d ON d.id = s_s.distribution_id
    WHERE
      d.number = $1
),
previous_distribution AS(
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
        distributions d
      WHERE
        d.number = $1 - 1))
SELECT
  qs.user_id,
  ROUND(COALESCE(pd.user_prev_shares, d.hodler_min_balance) /(
      SELECT
        minimum_sends * scaling_divisor
      FROM send_slash s_s
    WHERE
      s_s.distribution_id =(
        SELECT
          id
        FROM distributions
      WHERE
        number = $1)))::numeric AS send_ceiling
FROM( SELECT DISTINCT
    user_id
  FROM
    all_qualifying_sends) qs
  CROSS JOIN(
    SELECT
      hodler_min_balance
    FROM
      distributions
    WHERE
      number = $1) d
  LEFT JOIN previous_distribution pd ON pd.user_id = qs.user_id;
  -- Step 2: Update existing verifications
  UPDATE
    distribution_verifications dv
  SET
    weight = qs.amount,
    metadata = jsonb_build_object('value', scs.send_ceiling, 'sent_to', qs.sent_to)
  FROM
    send_ceiling_settings scs
    JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
  WHERE
    dv.user_id = qs.user_id
    AND dv.distribution_id =(
      SELECT
        id
      FROM
        distributions
      WHERE
        number = $1)
    AND dv.type = 'send_ceiling'
    AND COALESCE(qs.amount, 0) > 0;
  -- Step 3: Insert new verifications
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
        d.number = $1), qs.user_id, 'send_ceiling'::public.verification_type, qs.amount, jsonb_build_object('value', scs.send_ceiling, 'sent_to', qs.sent_to)
  FROM
    send_ceiling_settings scs
    JOIN all_qualifying_sends qs ON qs.user_id = scs.user_id
  WHERE
    COALESCE(qs.amount, 0) > 0
    AND NOT EXISTS(
      SELECT
        1
      FROM
        distribution_verifications dv
      WHERE
        dv.user_id = qs.user_id
        AND dv.distribution_id =(
          SELECT
            id
          FROM
            distributions
          WHERE
            number = $1)
          AND dv.type = 'send_ceiling');
  -- Cleanup temporary tables
  DROP TABLE IF EXISTS send_ceiling_settings;
  DROP TABLE IF EXISTS all_qualifying_sends;
END;
$$;

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
      'value', _send_ceiling, 'sent_to', ARRAY[_recipient_address]));
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
    metadata = jsonb_set(metadata, '{sent_to}', to_jsonb(array_append(COALESCE(metadata -> 'sent_to'::citext[], ARRAY[]::citext[]), _recipient_address))),
    weight = weight + LEAST(NEW.v, _send_ceiling)
  WHERE
    dv.user_id = _user_id
    AND distribution_id = _distribution_id
    AND type = 'send_ceiling'
    AND NOT (_recipient_address = ANY (metadata -> 'sent_to'::citext[]));
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

