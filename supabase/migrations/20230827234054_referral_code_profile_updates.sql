-- Adds the referral_code table to the profile
ALTER TABLE public.profiles ADD COLUMN referral_code TEXT UNIQUE DEFAULT generate_referral_code();

-- Update existing records to have a generated referral_code
UPDATE public.profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;