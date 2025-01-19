-- Scale distribution 11 to send token v1
-- Define the conversion factor: 10^18 (for decimals) / 100 (for supply reduction)
-- 1e16 == 10^18/100
-- select 300e6 * 1e16, 300e6 * power(10, 16);

-- update the distributions table for send token v0 and send token v0 merkle drop
update distributions
set merkle_drop_addr = '\x614F5273FdB63C1E1972fe1457Ce77DF1Ca440A6',
    token_decimals   = 0,
    token_addr       = '\x3f14920c99BEB920Afa163031c4e47a3e03B3e4A'
where number < 11;

-- update the distributions table for send token v1 and send token v1 merkle drop
-- amount and minimum balance
update distributions
set merkle_drop_addr   = '\xC8b80B16c40AaE14d8fCBBda94FfA5041089D048'
  , token_decimals     = 18
  , token_addr         = '\xEab49138BA2Ea6dd776220fE26b7b8E446638956'
  , amount             = (amount * 1e16)             -- 300M -> 3M tokens with 18 decimals
  , hodler_min_balance = (hodler_min_balance * 1e16) -- 750K -> 7.5k tokens with 18 decimals
where number = 11;

-- Update verification fixed values
UPDATE public.distribution_verification_values
SET fixed_value = fixed_value * 1e16
WHERE distribution_id = (SELECT id FROM distributions WHERE number = 11);

-- update distribution_shares
UPDATE public.distribution_shares
SET amount             = amount * 1e16
  , amount_after_slash = amount_after_slash * 1e16
  , hodler_pool_amount = hodler_pool_amount * 1e16
  , bonus_pool_amount  = bonus_pool_amount * 1e16
  , fixed_pool_amount  = fixed_pool_amount * 1e16
WHERE distribution_id = (SELECT id FROM distributions WHERE number = 11);
