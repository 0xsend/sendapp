-- Round #7
-- # Distribution 7
--
-- | Distribution 7      | Amount    |
-- | ------------------- | --------- |
-- | Open a Send account | 10K SEND  |
-- | Deposit 150 K send  | 5K SEND   |
-- | Deposit 5 USDC      | 5K SEND   |
-- | Register a Send tag | 10K SEND  |
-- |                     |           |
-- | Total Pool          | 150M SEND |
-- |                     |           |

-- Create the seventh distribution
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
           7,
           'Distribution #7',
           'Open a Send account, deposit 150 K send, deposit 5 USDC, register a Send tag',
           150000000,
           -- 150,000,000 SEND
           0,
           0,
           0,
           (select '2024-05-17T00:00:00Z'::timestamp with time zone),
           (
               select '2024-08-01T00:00:00Z'::timestamp with time zone - interval '1 second'
           ),
           --  150,000 SEND
           150000,
           (
               select '2024-10-01T00:00:00Z'::timestamp with time zone - interval '1 second'
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
           50000,
           0,
           (
               select id
               from distributions
               where "number" = 7
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
               where "number" = 7
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
           where "number" = 7
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
           where "number" = 7
           limit 1
       ), referrer_id, 'tag_referral'::public.verification_type, jsonb_build_object('referred_id', referred_id, 'tag', tag), tags.created_at
from referrals
         join tags on tags.name = referrals.tag
where created_at < (
    select qualification_end
    from distributions
    where "number" = 7
    limit 1
)
  and created_at > (
    select qualification_start
    from distributions
    where "number" = 7
    limit 1
);
