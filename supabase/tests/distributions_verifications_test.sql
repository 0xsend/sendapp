BEGIN;
SELECT plan(4);

-- Test distributions 1-6 (early distributions)
SELECT results_eq(
    $$SELECT array_agg(DISTINCT type ORDER BY type) FROM distribution_verification_values
      WHERE distribution_id BETWEEN 1 AND 6$$,
    $$SELECT array_agg(t ORDER BY t) FROM (
        VALUES ('tag_referral'::verification_type), ('tag_registration'::verification_type)
    ) as x(t)$$,
    'Early distributions (1-6) should only have tag verification types'
);

-- Test distribution 7
SELECT results_eq(
    $$SELECT array_agg(DISTINCT type ORDER BY type) FROM distribution_verification_values
      WHERE distribution_id = 7$$,
    $$SELECT array_agg(t ORDER BY t) FROM (
        SELECT t FROM unnest(enum_range(NULL::verification_type)) as t
        WHERE t::text NOT IN ('send_streak', 'send_ceiling', 'send_token_hodler')
    ) x$$,
    'Distribution 7 should have all types except send_streak, send_ceiling, and send_token_hodler'
);

-- Test distribution 8
SELECT results_eq(
    $$SELECT array_agg(DISTINCT type ORDER BY type) FROM distribution_verification_values
      WHERE distribution_id = 8$$,
    $$SELECT array_agg(t ORDER BY t) FROM (
        SELECT t FROM unnest(enum_range(NULL::verification_type)) as t
        WHERE t::text != 'send_ceiling' and t::text != 'send_token_hodler'
    ) x$$,
    'Distribution 8 should have all types except send_ceiling and send_token_hodler'
);

-- Test distributions 9+
SELECT results_eq(
    $$SELECT array_agg(DISTINCT type ORDER BY type) FROM distribution_verification_values
      WHERE distribution_id >= 9$$,
    $$SELECT array_agg(t ORDER BY t) FROM (
        SELECT DISTINCT t FROM unnest(enum_range(NULL::verification_type)) as t
    ) x$$,
    'Recent distributions (9+) should have all verification types'
);

SELECT finish();
ROLLBACK;