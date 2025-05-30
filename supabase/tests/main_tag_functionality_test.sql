BEGIN;
SELECT plan(15);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    tag1_id bigint;
    tag2_id bigint;
    tag3_id bigint;
    other_user_id uuid;
    other_send_account_id uuid;
    other_tag_id bigint;
BEGIN
    -- Setup test user and send account
    SELECT tests.create_supabase_user('main_tag_user') INTO test_user_id;
    PERFORM tests.authenticate_as('main_tag_user');
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('main_tag_user'), '0x2234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Setup another user for testing validation
    SELECT tests.create_supabase_user('main_tag_other') INTO other_user_id;
    PERFORM tests.authenticate_as('main_tag_other');
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('main_tag_other'), '0x3234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO other_send_account_id;
    
    -- Switch back to main test user for tag creation
    PERFORM tests.authenticate_as('main_tag_user');
    
    -- Test 1: No main tag initially
    PERFORM ok((
        SELECT main_tag_id FROM send_accounts WHERE id = test_send_account_id
    ) IS NULL, 'Send account has no main tag initially');
    
    -- Test 2: First confirmed tag becomes main automatically
    SELECT create_tag('maintag1', test_send_account_id) INTO tag1_id;
    
    -- Use service_role to update tag status directly
    SET ROLE service_role;
    UPDATE tags SET status = 'confirmed' WHERE id = tag1_id;
    SET ROLE postgres;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag1_id
    ), 'First confirmed tag auto-assigned as main');
    
    -- Test 3: Create and confirm second tag (should not auto-change main)
    SELECT create_tag('maintag2', test_send_account_id) INTO tag2_id;
    
    SET ROLE service_role;
    UPDATE tags SET status = 'confirmed' WHERE id = tag2_id;
    SET ROLE postgres;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag1_id
    ), 'Main tag remains the same when additional tags are confirmed');
    
    -- Test 4: Manual main tag change to owned confirmed tag
    PERFORM tests.authenticate_as('main_tag_user');
    
    UPDATE send_accounts 
    SET main_tag_id = tag2_id 
    WHERE id = test_send_account_id;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag2_id
    ), 'User can manually change main tag to their confirmed tag');
    
    -- Test 5: Cannot set main_tag_id to non-existent tag
    BEGIN
        UPDATE send_accounts 
        SET main_tag_id = 99999 
        WHERE id = test_send_account_id;
        PERFORM ok(false, 'Should not allow invalid main_tag_id');
    EXCEPTION 
        WHEN OTHERS THEN
            PERFORM ok(SQLERRM LIKE '%must be one of your confirmed tags%' OR SQLERRM LIKE '%violates foreign key%', 'Invalid main tag rejected: ' || SQLERRM);
    END;
    
    -- Test 6: Cannot set main_tag_id to unowned tag
    SELECT create_tag('othertag', other_send_account_id) INTO other_tag_id;
    
    SET ROLE service_role;
    UPDATE tags SET status = 'confirmed' WHERE id = other_tag_id;
    SET ROLE postgres;
    
    PERFORM tests.authenticate_as('main_tag_user');
    
    BEGIN
        UPDATE send_accounts 
        SET main_tag_id = other_tag_id 
        WHERE id = test_send_account_id;
        PERFORM ok(false, 'Should not allow setting unowned tag as main');
    EXCEPTION 
        WHEN OTHERS THEN
            PERFORM ok(SQLERRM LIKE '%must be one of your confirmed tags%' OR SQLERRM LIKE '%violates%', 'Unowned main tag rejected: ' || SQLERRM);
    END;
    
    -- Test 7: Cannot set main_tag_id to pending tag
    SELECT create_tag('maintag3', test_send_account_id) INTO tag3_id;
    
    BEGIN
        UPDATE send_accounts 
        SET main_tag_id = tag3_id 
        WHERE id = test_send_account_id;
        PERFORM ok(false, 'Should not allow setting pending tag as main');
    EXCEPTION 
        WHEN OTHERS THEN
            PERFORM ok(SQLERRM LIKE '%must be one of your confirmed tags%' OR SQLERRM LIKE '%violates%', 'Pending main tag rejected: ' || SQLERRM);
    END;
    
    -- Test 8: Cannot set main_tag_id to NULL when confirmed tags exist
    BEGIN
        UPDATE send_accounts 
        SET main_tag_id = NULL 
        WHERE id = test_send_account_id;
        PERFORM ok(false, 'Should not allow NULL main_tag_id with confirmed tags');
    EXCEPTION 
        WHEN OTHERS THEN
            PERFORM ok(SQLERRM LIKE '%Cannot set main_tag_id to NULL%', 'NULL main_tag_id prevented: ' || SQLERRM);
    END;
    
    -- Test 9: Main tag succession on deletion - delete current main
    SET ROLE service_role;
    DELETE FROM send_account_tags 
    WHERE send_account_id = test_send_account_id AND tag_id = tag2_id;
    SET ROLE postgres;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag1_id
    ), 'Next oldest tag promoted to main on deletion of main tag');
    
    -- Test 10: Main tag succession with multiple deletions
    -- Create and confirm third tag
    SET ROLE service_role;
    UPDATE tags SET status = 'confirmed' WHERE id = tag3_id;
    SET ROLE postgres;
    
    -- Delete current main (tag1), should promote to tag3 (next oldest confirmed)
    SET ROLE service_role;
    DELETE FROM send_account_tags 
    WHERE send_account_id = test_send_account_id AND tag_id = tag1_id;
    SET ROLE postgres;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag3_id
    ), 'Correct tag promoted to main with multiple confirmed tags');
    
    -- Test 11: NULL allowed for new accounts without confirmed tags
    DECLARE
        new_user_id uuid;
        new_send_account_id uuid;
    BEGIN
        SELECT tests.create_supabase_user('main_tag_new') INTO new_user_id;
        
        SET ROLE service_role;
        INSERT INTO send_accounts(user_id, address, chain_id, init_code, main_tag_id)
        VALUES (tests.get_supabase_uid('main_tag_new'), '0x9999999999999999999999999999999999999999', 8453, '\\x00', NULL)
        RETURNING id INTO new_send_account_id;
        SET ROLE postgres;
        
        PERFORM ok(EXISTS(
            SELECT 1 FROM send_accounts 
            WHERE id = new_send_account_id AND main_tag_id IS NULL
        ), 'NULL main_tag_id allowed for new accounts');
    END;
    
    -- Test 12: Main tag set to NULL when last confirmed tag is deleted
    SET ROLE service_role;
    DELETE FROM send_account_tags 
    WHERE send_account_id = test_send_account_id AND tag_id = tag3_id;
    SET ROLE postgres;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id IS NULL
    ), 'main_tag_id set to NULL when last confirmed tag is deleted');
    
    -- Test 13: Verify main tag auto-assignment works after deletion scenario
    -- Create new tag and confirm it
    DECLARE
        new_tag_id bigint;
    BEGIN
        SELECT create_tag('maintag_new', test_send_account_id) INTO new_tag_id;
        
        SET ROLE service_role;
        UPDATE tags SET status = 'confirmed' WHERE id = new_tag_id;
        SET ROLE postgres;
        
        PERFORM ok(EXISTS(
            SELECT 1 FROM send_accounts 
            WHERE id = test_send_account_id AND main_tag_id = new_tag_id
        ), 'Main tag auto-assignment works after all tags were deleted');
    END;
END $$;

SELECT finish();
ROLLBACK;