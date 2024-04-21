-- Distribution five is the second distribution on a new chain, Base (8453)

-- Round #5
-- 300m SEND for this round. 
-- Closes May 11th 11:59 PST
-- 150k minimum

-- Create the five distribution
INSERT INTO public.distributions (
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
    claim_end,
    chain_id
  )
VALUES (
    5,
    'Distribution #5',
    'Fifth distributions of 300,000,000 SEND tokens to early hodlers',
    300000000,
    -- 300,000,000 SEND
    6500,
    3500,
    1000,
    (select qualification_end from distributions where number = 4 limit 1),
    (
      select '2024-05-12T00:00:00Z'::timestamp with time zone - interval '1 second'
    ),
    --  150,000 SEND
    150000,
    (
      select '2024-07-12T00:00:00Z'::timestamp with time zone - interval '1 second'
    ),
    8453 -- Base chain
  );

INSERT INTO public.distribution_verification_values (
    type,
    fixed_value,
    bips_value,
    distribution_id
  )
VALUES (
    'tag_referral'::public.verification_type,
    0,
    500,
    (
      select id
      from distributions
      where "number" = 5
      limit 1
    )
  );

INSERT INTO public.distribution_verification_values (
    type,
    fixed_value,
    bips_value,
    distribution_id
  )
VALUES (
    'tag_registration'::public.verification_type,
    10000,
    0,
    (
      select id
      from distributions
      where "number" = 5
      limit 1
    )
  );

-- Add existing tags to distribution_verifications
insert into public.distribution_verifications (
    distribution_id,
    user_id,
    type,
    metadata,
    created_at
  )
select (
    select id
    from distributions
    where "number" = 5
    limit 1
  ), user_id, 'tag_registration'::public.verification_type, jsonb_build_object('tag', "name"), created_at
from tags
where status = 'confirmed'::public.tag_status;

-- Add existing referrals to distribution_verifications
insert into public.distribution_verifications (
    distribution_id,
    user_id,
    type,
    metadata,
    created_at
  )
select (
  select id
  from distributions
  where "number" = 5
  limit 1
), referrer_id, 'tag_referral'::public.verification_type, jsonb_build_object('referred_id', referred_id, 'tag', tag), tags.created_at
from referrals
  join tags on tags.name = referrals.tag
where created_at < (
    select qualification_end
    from distributions
    where "number" = 5
    limit 1
  )
and created_at > (
  select qualification_start
  from distributions
  where "number" = 5
  limit 1
);

