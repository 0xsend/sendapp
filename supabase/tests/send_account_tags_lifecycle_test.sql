BEGIN;
SELECT plan(10);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    created_tag_id bigint;
    reused_tag_id bigint;
    i integer;
BEGIN
    -- Setup test user and send account
    SELECT tests.create_supabase_user('lifecycle_user') INTO test_user_id;
    PERFORM tests.authenticate_as('lifecycle_user');

    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('lifecycle_user'), '0x1234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO test_send_account_id;

    -- Test 1: Create tag successfully
    SELECT create_tag('lifecycletag1', test_send_account_id) INTO created_tag_id;

    PERFORM ok(created_tag_id IS NOT NULL, 'create_tag returns tag_id');
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_account_tags sat
        WHERE sat.send_account_id = test_send_account_id AND sat.tag_id = created_tag_id
    ), 'Junction table entry created');

    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = created_tag_id AND status = 'pending'
    ), 'Tag created with pending status');

    -- Test 2: Tag reuse when available
    -- First make the tag available by removing association
    DELETE FROM send_account_tags WHERE tag_id = created_tag_id;
    UPDATE tags SET status = 'available', user_id = NULL WHERE id = created_tag_id;

    SELECT create_tag('lifecycletag1', test_send_account_id) INTO reused_tag_id;

    PERFORM ok(reused_tag_id = tag_id, 'Available tag reused (same tag_id returned)');
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = reused_tag_id AND status = 'pending'
    ), 'Available tag reused and set to pending');

    PERFORM ok(EXISTS(
        SELECT 1 FROM send_account_tags
        WHERE send_account_id = test_send_account_id AND tag_id = reused_tag_id
    ), 'Junction table entry created for reused tag');

    -- Test 3: Create multiple tags (test up to limit)
    FOR i IN 2..5 LOOP
        PERFORM create_tag('lifecycletag' || i, test_send_account_id);
    END LOOP;

    PERFORM ok((
        SELECT COUNT(*) FROM send_account_tags WHERE send_account_id = test_send_account_id
    ) = 5, 'User can create up to 5 tags');

    -- Test 4: Tag limit enforcement (attempt 6th tag)
    BEGIN
        PERFORM create_tag('lifecycletag6', test_send_account_id);
        PERFORM ok(false, 'Should not allow 6th tag');
    EXCEPTION
        WHEN OTHERS THEN
            PERFORM ok(SQLERRM LIKE '%at most 5 tags%' OR SQLERRM LIKE '%tag limit%', 'Tag limit enforced: ' || SQLERRM);
    END;

    -- Test 5: Verify user ownership in create_tag
    DECLARE
        other_user_id uuid;
        other_send_account_id uuid;
    BEGIN
        SELECT tests.create_supabase_user('lifecycle_other') INTO other_user_id;

        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('lifecycle_other'), '0x2234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO other_send_account_id;

        -- Try to create tag for another user's send account (should fail)
        PERFORM tests.authenticate_as('lifecycle_user');

        BEGIN
            PERFORM create_tag('unauthorized_tag', other_send_account_id);
            PERFORM ok(false, 'Should not allow creating tag for unowned send account');
        EXCEPTION
            WHEN OTHERS THEN
                PERFORM ok(SQLERRM LIKE '%not authorized%' OR SQLERRM LIKE '%permission%' OR SQLERRM LIKE '%access%', 'Unauthorized tag creation prevented: ' || SQLERRM);
        END;
    END;
END $$;

SELECT finish();
ROLLBACK;
