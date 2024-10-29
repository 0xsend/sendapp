-- change 'transfer_count' metadata field in distribution seven to 'value'
UPDATE
  public.distribution_verifications
SET
  metadata = jsonb_build_object('value',(metadata ->> 'transfer_count')::bigint)
WHERE
  distribution_id =(
    SELECT
      id
    FROM
      distributions
    WHERE
      number = 7)
  AND type IN ('send_ten', 'send_one_hundred')
  AND metadata ? 'transfer_count';

-- Step 1: Add the new weight column of type bigint
ALTER TABLE public.distribution_verifications
  ADD COLUMN weight bigint DEFAULT 1 NOT NULL;

-- Step 2: Update the weights column for distributions seven and eight
UPDATE
  public.distribution_verifications
SET
  weight =(metadata ->> 'value')::bigint
WHERE
  distribution_id IN (
    SELECT
      id
    FROM
      distributions
    WHERE
      number IN (7, 8))
  AND type IN ('total_tag_referrals', 'send_streak')
  AND metadata ? 'value';

