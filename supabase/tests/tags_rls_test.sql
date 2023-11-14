-- 1. RLS
BEGIN;

SELECT plan(1);

CREATE EXTENSION "basejump-supabase_test_helpers";

SELECT tests.rls_enabled('public', 'tags');

SELECT *
FROM finish();

ROLLBACK;
