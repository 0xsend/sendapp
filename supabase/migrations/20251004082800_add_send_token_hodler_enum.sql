-- Add verification type 'send_token_hodler'
-- Pattern follows prior enum additions (see 20241009042110_alter_db_for_monthly_distributions.sql)
ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_token_hodler' AFTER 'send_ceiling';