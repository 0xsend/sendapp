BEGIN;
SELECT
    plan(1);

-- DO $$
-- BEGIN
--     raise notice 'All distributions %', array_agg(id) FROM distributions;
--     raise notice 'All verification types %', array_agg(type) FROM distribution_verification_values;
--     raise notice 'All distributions that have a verification value for each type %', array_agg(id) FROM distributions WHERE id in (select distinct distribution_id from distribution_verification_values where type in (SELECT unnest(enum_range(NULL::verification_type))));
-- END;
-- $$;

-- ensure every distribution has a verification value for each type
select results_eq($$
        select id from distributions
    $$,
    $$
        select id from distributions
        where id in (
            select distinct distribution_id
            from distribution_verification_values
            where type in (SELECT unnest(enum_range(NULL::verification_type)))
        )
        order by id
    $$, 'All distributions have a verification value for each type');

SELECT
    finish();
ROLLBACK;
