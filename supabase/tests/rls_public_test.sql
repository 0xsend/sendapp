BEGIN;

select plan(1);

CREATE EXTENSION "basejump-supabase_test_helpers";

/**
 * ### tests.rls_enabled(testing_schema text, exclude_tables text[] )
 * pgTAP function to check if RLS is enabled on all tables in a provided schema minus any tables in the exclude_tables array
 *
 * Parameters:
 * - schema_name text - The name of the schema to check
 * - exclude_tables text[] - An array of table names to exclude from the check
 *
 * Example:
 * ```sql
 *   BEGIN;
 *       select plan(1);
 *       select tests.rls_enabled('public', ARRAY ['view1', 'view2']);
 *       SELECT * FROM finish();
 *   ROLLBACK;
 * ```
 */
CREATE OR REPLACE FUNCTION tests.rls_enabled (testing_schema text, exclude_tables text []) RETURNS text AS $$
select is(
    (
      select count(pc.relname)::integer
      from pg_class pc
        join pg_namespace pn on pn.oid = pc.relnamespace
        and pn.nspname = rls_enabled.testing_schema
        and pc.relname not in (
          select unnest(rls_enabled.exclude_tables)
        )
        join pg_type pt on pt.oid = pc.reltype
      where relrowsecurity = FALSE
    ),
    0,
    'All tables in the ' || testing_schema || ' schema should have row level security enabled'
  );

$$ LANGUAGE sql;

select tests.rls_enabled(
    'public',
    ARRAY ['distribution_verifications_summary', 'users']
  );

SELECT *
FROM finish();

ROLLBACK;
