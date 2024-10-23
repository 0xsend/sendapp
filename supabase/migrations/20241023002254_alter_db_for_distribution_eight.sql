-- Define whether a verification mode should count the number of verifications rows
-- or use the value saved in the metadata
CREATE TYPE verification_value_mode AS ENUM(
  'individual',
  'aggregate'
);

ALTER TYPE public.verification_type
  ADD VALUE IF NOT EXISTS 'send_streak';

-- Default to individual to support legacy
ALTER TABLE public.distribution_verification_values
  ADD COLUMN mode verification_value_mode NOT NULL DEFAULT 'individual'
