-- Update existing referrals to keep only the oldest referral for each user
WITH ranked_referrals AS (
  SELECT
    r.*,
    ROW_NUMBER() OVER (PARTITION BY referred_id ORDER BY t.created_at) AS rn
  FROM
    public.referrals r
    JOIN public.tags t ON r.tag = t.name)
DELETE FROM public.referrals
WHERE id IN (
    SELECT
      id
    FROM
      ranked_referrals
    WHERE
      rn > 1);

-- Add UNIQUE constraint on referred_id
ALTER TABLE public.referrals
  ADD CONSTRAINT unique_referred_id UNIQUE (referred_id);

