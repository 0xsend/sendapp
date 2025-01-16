DELETE FROM public.distribution_verification_values
WHERE distribution_id = 11
  AND type = 'create_passkey';

-- Add create_passkey verifications for all existing Send accounts
INSERT INTO public.distribution_verifications(
  distribution_id,
  user_id,
  type,
  metadata,
  created_at)
SELECT
  (
    SELECT
      id
    FROM
      distributions
    WHERE
      "number" = 11
    LIMIT 1) AS distribution_id,
sa.user_id,
'create_passkey'::public.verification_type AS type,
jsonb_build_object('account_created_at', sa.created_at) AS metadata,
LEAST(sa.created_at,(
    SELECT
      qualification_end
    FROM distributions
    WHERE
      "number" = 11 LIMIT 1)) AS created_at
FROM
  send_accounts sa
WHERE
  sa.created_at <=(
    SELECT
      qualification_end
    FROM
      distributions
    WHERE
      "number" = 11
    LIMIT 1);
