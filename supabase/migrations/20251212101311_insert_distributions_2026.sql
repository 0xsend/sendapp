-- Insert distributions 23-34 (January through December 2026)
-- Following the pattern from distribution 22 (most recent):
-- 2,000,000 SEND per distribution, 10,000 SEND min balance, 50 USDC earn min

DO $$
DECLARE
    dist_num integer;
    tranche_num integer;
    dist_name text;
    dist_description text;
    qual_start timestamp with time zone;
    qual_end timestamp with time zone;
    month_names text[] := ARRAY[
        'Twenty-third', 'Twenty-fourth', 'Twenty-fifth', 'Twenty-sixth',
        'Twenty-seventh', 'Twenty-eighth', 'Twenty-ninth', 'Thirtieth',
        'Thirty-first', 'Thirty-second', 'Thirty-third', 'Thirty-fourth'
    ];
BEGIN
    -- Loop through distributions 23-34 (Jan-Dec 2026)
    FOR i IN 23..34 LOOP
        dist_num := i;
        tranche_num := i - 7; -- tranche_id = distribution_number - 7 (23-7=16, 24-7=17, etc.)
        dist_name := 'Distribution #' || i;
        dist_description := month_names[i - 22] || ' distribution of 2,000,000 SEND tokens to early hodlers';

        -- Set qualification dates for each month of 2026
        CASE i
            WHEN 23 THEN  -- January 2026
                qual_start := '2026-01-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-02-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 24 THEN  -- February 2026
                qual_start := '2026-02-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-03-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 25 THEN  -- March 2026
                qual_start := '2026-03-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-04-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 26 THEN  -- April 2026
                qual_start := '2026-04-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-05-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 27 THEN  -- May 2026
                qual_start := '2026-05-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-06-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 28 THEN  -- June 2026
                qual_start := '2026-06-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-07-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 29 THEN  -- July 2026
                qual_start := '2026-07-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-08-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 30 THEN  -- August 2026
                qual_start := '2026-08-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-09-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 31 THEN  -- September 2026
                qual_start := '2026-09-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-10-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 32 THEN  -- October 2026
                qual_start := '2026-10-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-11-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 33 THEN  -- November 2026
                qual_start := '2026-11-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-12-01T00:00:00Z'::timestamp with time zone - interval '1 second';
            WHEN 34 THEN  -- December 2026
                qual_start := '2026-12-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2027-01-01T00:00:00Z'::timestamp with time zone - interval '1 second';
        END CASE;

        -- Insert distribution (using same values as distribution 22)
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
            tranche_id,
            sendpot_ticket_increment
        ) VALUES (
            dist_num,
            dist_name,
            dist_description,
            2000000000000000000000000, -- 2,000,000 SEND
            10000,
            0,
            10000,
            qual_start,
            qual_end,
            10000000000000000000000, -- 10,000 SEND
            50000000, -- 50 USDC (in USDC's 6 decimals)
            'infinity',
            8453, -- Base chain
            '\\x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57',
            18,
            '\\xEab49138BA2Ea6dd776220fE26b7b8E446638956',
            tranche_num,
            10 -- sendpot_ticket_increment
        );

        -- Insert verification values for each distribution
        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'tag_registration'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'create_passkey'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_ten'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_one_hundred'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'total_tag_referrals'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'tag_referral'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_streak'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_ceiling'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'sendpot_ticket_purchase'::public.verification_type
        );

        -- Insert send slash config
        PERFORM insert_send_slash(distribution_number => dist_num);

    END LOOP;
END $$;
