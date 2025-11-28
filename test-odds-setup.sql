-- Create test subadmin if it doesn't exist
DO $$
DECLARE
    subadmin_id INTEGER;
    player_id INTEGER;
    test_password TEXT := '$2b$10$wFj9hrWmplY1zlLn0JbdguXL0MzPJhM/wQlmILOuEHcRWxbNyaYV.'; -- hashed 'testing123'
BEGIN
    -- Check if subadmin exists
    SELECT id INTO subadmin_id FROM users WHERE username = 'oddstester';
    
    IF subadmin_id IS NULL THEN
        -- Create the subadmin
        INSERT INTO users (username, email, password, mobile, role, balance, is_blocked)
        VALUES ('oddstester', 'oddstester@example.com', test_password, '1234567890', 'subadmin', 10000, false)
        RETURNING id INTO subadmin_id;
        
        RAISE NOTICE 'Created new subadmin with ID: %', subadmin_id;
    ELSE
        RAISE NOTICE 'Using existing subadmin with ID: %', subadmin_id;
    END IF;
    
    -- Check if test player exists
    SELECT id INTO player_id FROM users WHERE username = 'playertester';
    
    IF player_id IS NULL THEN
        -- Create the player assigned to our subadmin
        INSERT INTO users (username, email, password, mobile, role, balance, assigned_to, is_blocked)
        VALUES ('playertester', 'playertester@example.com', test_password, '9876543210', 'player', 5000, subadmin_id, false)
        RETURNING id INTO player_id;
        
        RAISE NOTICE 'Created new player with ID: %', player_id;
    ELSE
        -- Update player to ensure it's assigned to our subadmin
        UPDATE users SET assigned_to = subadmin_id WHERE id = player_id;
        RAISE NOTICE 'Updated existing player (ID: %) to be assigned to subadmin ID: %', player_id, subadmin_id;
    END IF;
    
    -- Set custom coin flip odds for the subadmin
    IF EXISTS (SELECT 1 FROM game_odds WHERE game_type = 'coin_flip' AND subadmin_id = subadmin_id) THEN
        -- Update existing odds
        UPDATE game_odds 
        SET odd_value = 245 -- 2.45x (different from platform default)
        WHERE game_type = 'coin_flip' AND subadmin_id = subadmin_id;
        
        RAISE NOTICE 'Updated coin flip odds for subadmin';
    ELSE
        -- Insert new odds
        INSERT INTO game_odds (game_type, odd_value, set_by_admin, subadmin_id)
        VALUES ('coin_flip', 245, false, subadmin_id);
        
        RAISE NOTICE 'Created new coin flip odds for subadmin';
    END IF;
    
    RAISE NOTICE 'Test setup completed successfully';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE 'Subadmin: username=oddstester, password=testing123';
    RAISE NOTICE 'Player: username=playertester, password=testing123';
END
$$;