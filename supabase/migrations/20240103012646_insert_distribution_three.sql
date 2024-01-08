-- Create the third distribution
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
    snapshot_id,
    hodler_min_balance,
    claim_end
  )
VALUES (
    3,
    'Distribution #3',
    'Third distributions of 1,000,000,000 SEND tokens to early hodlers',
    1000000000,
    -- 1,000,000,000 SEND
    6500,
    3500,
    1000,
    '2024-01-01T00:00:00Z',
    (
      select '2024-02-01T00:00:00Z'::timestamp with time zone - interval '1 second'
    ),
    null,
    4e6::bigint,
    -- 4,000,000 SEND
    (
      select '2024-05-01T00:00:00Z'::timestamp with time zone - interval '1 second'
    )
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
      where "number" = 3
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
      where "number" = 3
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
    where "number" = 3
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
    where "number" = 3
    limit 1
  ), referrer_id, 'tag_referral'::public.verification_type, jsonb_build_object('referred_id', referred_id, 'tag', tag), tags.created_at
from referrals
  join tags on tags.name = referrals.tag
where created_at < (
    select qualification_end
    from distributions
    where "number" = 3
    limit 1
  )
  and created_at > (
    select qualification_start
    from distributions
    where "number" = 3
    limit 1
  );

-- set claim end for  distributions one and two to 2024-03-01T00:00:00Z
update distributions
set claim_end = '2024-03-01T00:00:00Z'::timestamp with time zone - interval '1 second'
where id in (
    select id
    from distributions
    where "number" in (1, 2)
  );
