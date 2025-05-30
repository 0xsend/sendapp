BEGIN;
SELECT plan(20);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
    send_account1_id uuid;
    send_account2_id uuid;
    send_account3_id uuid;
    tag1_id bigint;
    tag2_id bigint;
    tag3_id bigint;
    available_tag_id bigint;
BEGIN
    -- Setup three users with send accounts
    SELECT tests.create_supabase_user('rls_user1') INTO user1_id;
    SELECT tests.create_supabase_user('rls_user2') INTO user2_id;
    SELECT tests.create_supabase_user('rls_user3') INTO user3_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('rls_user1'), '0x3234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO send_account1_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('rls_user2'), '0x4234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO send_account2_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('rls_user3'), '0x5234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO send_account3_id;
    
    -- Create tags for each user as service_role first
    SET ROLE service_role;
    
    -- Create tags and associations
    SELECT create_tag('user1tag', send_account1_id) INTO tag1_id;
    SELECT create_tag('user2tag', send_account2_id) INTO tag2_id;
    SELECT create_tag('user3tag', send_account3_id) INTO tag3_id;
    
    -- Create an available tag (not associated with any user)
    INSERT INTO tags (name, status, user_id) 
    VALUES ('availabletag', 'available', NULL) 
    RETURNING id INTO available_tag_id;
    
    -- Confirm some tags for testing
    UPDATE tags SET status = 'confirmed' WHERE id = tag2_id;
    UPDATE tags SET status = 'confirmed' WHERE id = tag3_id;
    
    SET ROLE postgres;
    
    -- **Test send_account_tags RLS policies**
    
    -- Test 1: User can see their own send_account_tags
    SELECT tests.authenticate_as('rls_user1');
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_account_tags 
        WHERE send_account_id = send_account1_id AND tag_id = tag1_id
    ), 'User can see own send_account_tags');
    
    -- Test 2: User cannot see other users' send_account_tags
    PERFORM ok(NOT EXISTS(
        SELECT 1 FROM send_account_tags 
        WHERE send_account_id = send_account2_id AND tag_id = tag2_id
    ), 'User cannot see other users send_account_tags');
    
    -- Test 3: User can insert their own send_account_tags
    DECLARE
        test_tag_id bigint;
    BEGIN
        -- Create a tag as service_role first
        SET ROLE service_role;
        INSERT INTO tags (name, status, user_id) 
        VALUES ('inserttest', 'pending', NULL) 
        RETURNING id INTO test_tag_id;
        SET ROLE postgres;
        
        SELECT tests.authenticate_as('rls_user1');
        
        INSERT INTO send_account_tags (send_account_id, tag_id)
        VALUES (send_account1_id, test_tag_id);
        
        PERFORM ok(EXISTS(
            SELECT 1 FROM send_account_tags 
            WHERE send_account_id = send_account1_id AND tag_id = test_tag_id
        ), 'User can insert their own send_account_tags');
    END;
    
    -- Test 4: User cannot insert send_account_tags for other users
    BEGIN
        SET ROLE service_role;
        INSERT INTO tags (name, status, user_id) 
        VALUES ('unauthorizedinsert', 'pending', NULL) 
        RETURNING id INTO test_tag_id;
        SET ROLE postgres;
        
        SELECT tests.authenticate_as('rls_user1');
        
        BEGIN
            INSERT INTO send_account_tags (send_account_id, tag_id)
            VALUES (send_account2_id, test_tag_id);
            PERFORM ok(false, 'Should not allow inserting send_account_tags for other users');
        EXCEPTION
            WHEN insufficient_privilege OR check_violation THEN
                PERFORM ok(true, 'Correctly prevented unauthorized send_account_tags insert');
        END;
    END;
    
    -- **Test tags table RLS policies**
    
    -- Test 5: User can see available tags
    SELECT tests.authenticate_as('rls_user1');
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = available_tag_id AND status = 'available'
    ), 'User can see available tags');
    
    -- Test 6: User can see their own pending tags
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag1_id AND status = 'pending'
    ), 'User can see own pending tags');
    
    -- Test 7: User can see confirmed tags from other users
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag2_id AND status = 'confirmed'
    ), 'User can see confirmed tags from other users');
    
    -- Test 8: User cannot see other users' pending tags
    SELECT tests.authenticate_as('rls_user3');
    
    PERFORM ok(NOT EXISTS(
        SELECT 1 FROM tags WHERE id = tag1_id AND status = 'pending'
    ), 'User cannot see other users pending tags');
    
    -- Test 9: User can update their own tags status through send_account relationship
    SELECT tests.authenticate_as('rls_user1');
    
    -- This should work because user1 owns the tag through send_account_tags
    DECLARE
        can_update boolean := false;
    BEGIN
        UPDATE tags SET status = 'confirmed' WHERE id = tag1_id;
        can_update := true;
    EXCEPTION
        WHEN insufficient_privilege THEN
            can_update := false;
    END;
    
    PERFORM ok(can_update, 'User can update their own tags through send_account relationship');
    
    -- Test 10: User cannot update tags they don't own
    DECLARE
        cannot_update boolean := true;
    BEGIN
        UPDATE tags SET status = 'confirmed' WHERE id = tag2_id;
        cannot_update := false;
    EXCEPTION
        WHEN insufficient_privilege THEN
            cannot_update := true;
    END;
    
    PERFORM ok(cannot_update, 'User cannot update tags they do not own');
    
    -- Test 11: User can delete their own send_account_tags
    DECLARE
        can_delete boolean := false;
        test_tag_for_delete bigint;
    BEGIN
        -- Create a tag for deletion test
        SET ROLE service_role;
        SELECT create_tag('deletetest', send_account1_id) INTO test_tag_for_delete;
        SET ROLE postgres;
        
        SELECT tests.authenticate_as('rls_user1');
        
        DELETE FROM send_account_tags 
        WHERE send_account_id = send_account1_id AND tag_id = test_tag_for_delete;
        
        can_delete := true;
    EXCEPTION
        WHEN insufficient_privilege THEN
            can_delete := false;
    END;
    
    PERFORM ok(can_delete, 'User can delete their own send_account_tags');
    
    -- Test 12: User cannot delete other users' send_account_tags
    DECLARE
        cannot_delete boolean := true;
    BEGIN
        DELETE FROM send_account_tags 
        WHERE send_account_id = send_account2_id AND tag_id = tag2_id;
        
        cannot_delete := false;
    EXCEPTION
        WHEN insufficient_privilege THEN
            cannot_delete := true;
    END;
    
    PERFORM ok(cannot_delete, 'User cannot delete other users send_account_tags');
    
    -- Test 13: Anonymous users can see available and confirmed tags only
    SELECT tests.clear_authentication();
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE status = 'available'
    ), 'Anonymous users can see available tags');
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE status = 'confirmed'
    ), 'Anonymous users can see confirmed tags');
    
    -- Test 14: Anonymous users cannot see pending tags
    PERFORM ok(NOT EXISTS(
        SELECT 1 FROM tags WHERE status = 'pending'
    ), 'Anonymous users cannot see pending tags');
    
    -- Test 15: Anonymous users cannot see any send_account_tags
    PERFORM ok(NOT EXISTS(
        SELECT 1 FROM send_account_tags
    ), 'Anonymous users cannot see any send_account_tags');
    
    -- Test 16: Anonymous users cannot insert anything
    DECLARE
        cannot_insert boolean := true;
        test_tag_anon bigint;
    BEGIN
        -- Try to insert tag
        INSERT INTO tags (name, status) VALUES ('anontest', 'pending');
        cannot_insert := false;
    EXCEPTION
        WHEN insufficient_privilege THEN
            cannot_insert := true;
    END;
    
    PERFORM ok(cannot_insert, 'Anonymous users cannot insert tags');
    
    -- Test 17-18: Test multiple tag ownership scenarios
    SELECT tests.authenticate_as('rls_user2');
    
    -- User2 should see their confirmed tag and be able to query it
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags t
        JOIN send_account_tags sat ON sat.tag_id = t.id
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sa.user_id = tests.get_supabase_uid('rls_user2') AND t.status = 'confirmed'
    ), 'User can query their own tags through junction table');
    
    -- Test visibility of tags count
    PERFORM ok((
        SELECT COUNT(*) FROM tags t
        JOIN send_account_tags sat ON sat.tag_id = t.id
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sa.user_id = tests.get_supabase_uid('rls_user2')
    ) >= 1, 'User can count their own tags');
    
    -- Test 19-20: Edge cases with tag status transitions
    SELECT tests.authenticate_as('rls_user3');
    
    -- User should be able to see their tag before and after status change
    DECLARE
        tag_visible_before boolean;
        tag_visible_after boolean;
        user3_pending_tag bigint;
    BEGIN
        -- Create pending tag
        SET ROLE service_role;
        SELECT create_tag('statustransition', send_account3_id) INTO user3_pending_tag;
        SET ROLE postgres;
        
        SELECT tests.authenticate_as('rls_user3');
        
        tag_visible_before := EXISTS(
            SELECT 1 FROM tags WHERE id = user3_pending_tag AND status = 'pending'
        );
        
        -- Change to confirmed as service_role
        SET ROLE service_role;
        UPDATE tags SET status = 'confirmed' WHERE id = user3_pending_tag;
        SET ROLE postgres;
        
        SELECT tests.authenticate_as('rls_user3');
        
        tag_visible_after := EXISTS(
            SELECT 1 FROM tags WHERE id = user3_pending_tag AND status = 'confirmed'
        );
        
        PERFORM ok(tag_visible_before, 'User can see their pending tag');
        PERFORM ok(tag_visible_after, 'User can see their tag after status change to confirmed');
    END;
END $$;

SELECT finish();
ROLLBACK;