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
  _verification_record record;
BEGIN
  -- Get the sender's user_id
  SELECT send_accounts.user_id INTO _user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(NEW.f, 'hex'))::citext;

  -- Get recipient address
  _recipient_address := concat('0x', encode(NEW.t, 'hex'))::citext;

  -- Validate transaction value
  IF NEW.v <= 0 THEN
    RETURN NEW; -- Skip processing for zero or negative values
  END IF;

  -- Get the active distribution id and number
  SELECT d.id, d.number
  INTO _distribution_id, _distribution_number
  FROM distributions d
  WHERE extract(epoch FROM d.qualification_start) <= NEW.block_time
    AND extract(epoch FROM d.qualification_end) > NEW.block_time;

  -- If we found matching distribution and user
  IF _user_id IS NOT NULL AND _distribution_id IS NOT NULL THEN
    -- Try to update existing verification first
    UPDATE distribution_verifications dv
    SET
      metadata = CASE
        WHEN NOT (_recipient_address = ANY(
          ARRAY(SELECT jsonb_array_elements_text(metadata -> 'sent_to'))::citext[]
        )) THEN
          jsonb_build_object(
            'value', (metadata ->> 'value'),
            'sent_to', metadata -> 'sent_to' || jsonb_build_array(_recipient_address)
          )
        ELSE metadata
      END,
      weight = weight + CASE
        WHEN NOT (_recipient_address = ANY(
          ARRAY(SELECT jsonb_array_elements_text(metadata -> 'sent_to'))::citext[]
        )) THEN
          LEAST(NEW.v, (metadata ->> 'value')::numeric)
        ELSE 0
      END
    WHERE dv.user_id = _user_id
      AND distribution_id = _distribution_id
      AND type = 'send_ceiling'
    RETURNING metadata ->> 'value' INTO _send_ceiling;

    -- If no row was updated, create new verification
    IF NOT FOUND THEN
      -- Calculate send ceiling for new verification
      WITH send_settings AS (
        SELECT minimum_sends * scaling_divisor AS divider
        FROM send_slash s_s
        JOIN distributions d ON d.id = s_s.distribution_id
        WHERE d.number = _distribution_number
      ),
      previous_distribution AS (
        SELECT ds.user_id,
          ds.amount AS user_prev_shares
        FROM distribution_shares ds
        WHERE ds.distribution_id = (
          SELECT id
          FROM distributions
          WHERE number = _distribution_number - 1
        )
        AND ds.user_id = _user_id
      ),
      distribution_info AS (
        SELECT hodler_min_balance
        FROM distributions
        WHERE id = _distribution_id
      )
      SELECT ROUND(COALESCE(pd.user_prev_shares, di.hodler_min_balance) / NULLIF(ss.divider, 0))::numeric
      INTO _send_ceiling
      FROM distribution_info di
      CROSS JOIN send_settings ss
      LEFT JOIN previous_distribution pd ON pd.user_id = _user_id;

      -- Handle NULL or zero divider case
      IF _send_ceiling IS NULL OR _send_ceiling < 0 THEN
        RAISE NOTICE 'Invalid send ceiling calculation result: %', _send_ceiling;
        _send_ceiling := 0; -- Default fallback
      END IF;

      -- Create new verification
      INSERT INTO distribution_verifications(
        distribution_id,
        user_id,
        type,
        weight,
        metadata
      )
      VALUES (
        _distribution_id,
        _user_id,
        'send_ceiling',
        LEAST(NEW.v, _send_ceiling),
        jsonb_build_object(
          'value', _send_ceiling::text,
          'sent_to', jsonb_build_array(_recipient_address)
        )
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in insert_verification_send_ceiling: %', SQLERRM;
    RETURN NEW; -- Continue processing even if this trigger fails
END;
$$;