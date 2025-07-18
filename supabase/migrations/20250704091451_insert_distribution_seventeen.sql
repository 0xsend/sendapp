-- Round #17
-- 3m $send
-- Opens July 01st 00:00 UTC
-- Closes July 31st 23:59 UTC
-- 1k minimum
INSERT INTO public.distributions(
  number,
  name,
  description,
  amount,
  hodler_pool_bips,
  bonus_pool_bips,
  fixed_pool_bips,
  qualification_start,
  qualification_end,
  hodler_min_balance,
  earn_min_balance,
  claim_end,
  chain_id,
  merkle_drop_addr,
  token_decimals,
  token_addr,
  tranche_id)
VALUES (
  17,
  'Distribution #17',
  'Seventeenth distribution of 3,000,000 SEND tokens to early hodlers',
  3000000000000000000000000, -- 3,000,000 SEND
  10000,
  0,
  10000,
  '2025-07-01T00:00:00Z' ::timestamp with time zone,
  '2025-08-01T00:00:00Z' ::timestamp with time zone - interval '1 second',
  1000000000000000000000, -- 1,000 SEND
  5e6, -- 5 USDC
  'infinity',
  8453, -- Base chain
  '\x2c1730cd8f40d0458b7b5849e6cc2904a7d18a57',
  18,
  '\xEab49138BA2Ea6dd776220fE26b7b8E446638956',
  9);

-- Insert verification values
-- Default to previous month values unless strictly changed
SELECT insert_verification_value(
  distribution_number => 17,
  type => 'tag_registration'::public.verification_type
);


SELECT insert_verification_value(
  distribution_number  => 17,
  type => 'create_passkey'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'send_ten'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'send_one_hundred'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'total_tag_referrals'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'tag_referral'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'send_streak'::public.verification_type
);

SELECT insert_verification_value(
  distribution_number => 17,
  type => 'send_ceiling'::public.verification_type
);

--Insert send slash config

SELECT insert_send_slash(distribution_number => 17);

-- Insert verifications

SELECT insert_create_passkey_verifications(17);

SELECT insert_tag_registration_verifications(17);

SELECT insert_tag_referral_verifications(17);

SELECT insert_total_referral_verifications(17);

SELECT insert_send_verifications(17);

SELECT insert_send_streak_verifications(17);

SELECT
  calculate_and_insert_send_ceiling_verification(17);