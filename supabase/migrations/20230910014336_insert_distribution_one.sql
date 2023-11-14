-- Create the first distributions
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
        1,
        'Distribution #1',
        'First distributions of 1,000,000,000 SEND tokens to early hodlers',
        1000000000,
        6500,
        3500,
        1000,
        '2023-08-28T00:00:00Z',
        (
            select '2023-10-01T00:00:23Z'::timestamp with time zone -- https://etherscan.io/tx/0x7edbdf72abb6cc0da99bb42fe74a9acd83089a8c4b702e3ea7c5dc9db81de60b
        ),
        1,
        1e6::bigint,
        (
            select '2023-12-01T00:00:00Z'::timestamp with time zone - interval '1 second'
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
        1
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
        1
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
        where "number" = 1
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
        where "number" = 1
        limit 1
    ), referrer_id, 'tag_referral'::public.verification_type, jsonb_build_object('referred_id', referred_id, 'tag', tag), tags.created_at
from referrals
    join tags on tags.name = referrals.tag;
