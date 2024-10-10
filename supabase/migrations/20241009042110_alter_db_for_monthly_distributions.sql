ALTER TABLE public.distribution_verification_values
  ADD COLUMN multiplier_min NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  ADD COLUMN multiplier_max NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  ADD COLUMN multiplier_step NUMERIC(10, 4) NOT NULL DEFAULT 0.0;

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'create_passkey';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_ten';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_one_hundred';

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'total_tag_referral';

