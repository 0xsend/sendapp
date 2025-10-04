BEGIN;
SELECT plan(1);

-- For distributions with id >= 21, expect send_token_hodler to exist.
-- If no such distributions exist in the fixture, this test passes vacuously.
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM public.distributions d
    WHERE d.id >= 21
      AND NOT EXISTS (
        SELECT 1
        FROM public.distribution_verification_values dvv
        WHERE dvv.distribution_id = d.id
          AND dvv.type = 'send_token_hodler'::public.verification_type
      )
  ),
  'All distributions with id >= 21 have send_token_hodler verification value'
);

SELECT finish();
ROLLBACK;