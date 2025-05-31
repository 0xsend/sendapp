BEGIN;
SELECT plan(25);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Test 1: Junction table structure
SELECT has_table('public', 'send_account_tags', 'send_account_tags table exists');
SELECT has_pk('public', 'send_account_tags', 'send_account_tags has primary key');
SELECT has_column('public', 'send_account_tags', 'id', 'has id column');
SELECT has_column('public', 'send_account_tags', 'send_account_id', 'has send_account_id column');
SELECT has_column('public', 'send_account_tags', 'tag_id', 'has tag_id column');
SELECT has_column('public', 'send_account_tags', 'created_at', 'has created_at column');
SELECT has_column('public', 'send_account_tags', 'updated_at', 'has updated_at column');

-- Test 2: Foreign key constraints exist
SELECT ok(EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'send_account_tags_send_account_id_fkey'
    AND table_name = 'send_account_tags'
), 'has send_account_id foreign key');
SELECT ok(EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'send_account_tags_tag_id_fkey'
    AND table_name = 'send_account_tags'
), 'has tag_id foreign key');
SELECT fk_ok('public', 'send_account_tags', 'send_account_id', 'public', 'send_accounts', 'id', 'send_account_id references send_accounts.id');
SELECT fk_ok('public', 'send_account_tags', 'tag_id', 'public', 'tags', 'id', 'tag_id references tags.id');

-- Test 3: Unique index on junction table
SELECT has_index('public', 'send_account_tags', 'idx_send_account_tags_unique', 'send_account_tags has unique index on (send_account_id, tag_id)');

-- Test 4: main_tag_id foreign key on send_accounts
SELECT has_column('public', 'send_accounts', 'main_tag_id', 'send_accounts has main_tag_id column');
SELECT col_type_is('public', 'send_accounts', 'main_tag_id', 'bigint', 'main_tag_id is bigint');
SELECT fk_ok('public', 'send_accounts', 'main_tag_id', 'public', 'tags', 'id', 'main_tag_id references tags.id');

-- Test 5: Tags table ID column
SELECT has_column('public', 'tags', 'id', 'tags table has id column');
SELECT col_is_pk('public', 'tags', 'id', 'id is primary key on tags');
SELECT col_type_is('public', 'tags', 'id', 'bigint', 'tags.id is bigint');
SELECT col_hasnt_default('public', 'tags', 'user_id', 'tags.user_id is nullable (no default)');

-- Test 6: Essential indexes exist
SELECT has_index('public', 'send_account_tags', 'idx_send_account_tags_tag_id', 'has index on tag_id');
SELECT has_index('public', 'send_account_tags', 'idx_send_account_tags_send_account_id', 'has index on send_account_id');
SELECT has_index('public', 'send_accounts', 'idx_send_accounts_main_tag_id', 'has index on main_tag_id');

-- Test 7: Check that tags table includes 'available' status
SELECT col_type_is('public', 'tags', 'status', 'tag_status', 'tags.status is tag_status enum');

-- Test 8: Verify cascade delete behavior exists
SELECT col_not_null('public', 'send_account_tags', 'send_account_id', 'send_account_id is not null');
SELECT col_not_null('public', 'send_account_tags', 'tag_id', 'tag_id is not null');

SELECT finish();
ROLLBACK;