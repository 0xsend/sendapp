-- Create function to insert verification when a send account is created
CREATE OR REPLACE FUNCTION "public"."insert_verification_create_passkey"()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;
  -- Insert verification for create_passkey
  IF curr_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT
      1
    FROM
      public.distribution_verifications
    WHERE
      user_id = NEW.user_id AND distribution_id = curr_distribution_id AND type = 'create_passkey'::public.verification_type) THEN
    INSERT INTO public.distribution_verifications(
      distribution_id,
      user_id,
      type,
      metadata,
      created_at -- Removed the extra comma here
)
    VALUES (
      curr_distribution_id,
      NEW.user_id,
      'create_passkey' ::public.verification_type,
      jsonb_build_object(
        'account_created_at', NEW.created_at),
      NEW.created_at);
  END IF;
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER "insert_verification_create_passkey"
  AFTER INSERT ON "public"."send_accounts"
  FOR EACH ROW
  EXECUTE PROCEDURE "public"."insert_verification_create_passkey"();

