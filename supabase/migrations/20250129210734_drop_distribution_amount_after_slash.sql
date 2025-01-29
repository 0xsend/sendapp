-- drop the amount_after_slash column since it's no longer needed
ALTER TABLE public.distribution_shares
  DROP COLUMN amount_after_slash;

