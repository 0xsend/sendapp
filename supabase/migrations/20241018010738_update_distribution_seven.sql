-- Update hodler_min_balance for distribution #7
UPDATE
  public.distributions
SET
  hodler_min_balance = 300000
WHERE
  number = 7;

