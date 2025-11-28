/**
 * This script creates test users for validating game odds:
 * 1. A new subadmin
 * 2. A player assigned to that subadmin
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';

async function createTestUsers() {
  console.log('Starting to create test users...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Create hash for password
    const saltRounds = 10;
    const password = 'pass123';
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('Password hashed successfully');
    
    // Create test subadmin if doesn't exist
    const subadminCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      ['oddstester']
    );
    
    let subadminId;
    
    if (subadminCheck.rows.length === 0) {
      // Create subadmin
      const subadminResult = await pool.query(
        `INSERT INTO users 
        (username, email, password, mobile, role, balance, is_blocked) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id`,
        ['oddstester', 'oddstester@example.com', hashedPassword, '1234567890', 'subadmin', 10000, false]
      );
      
      subadminId = subadminResult.rows[0].id;
      console.log(`Test subadmin created with ID: ${subadminId}`);
    } else {
      subadminId = subadminCheck.rows[0].id;
      console.log(`Using existing subadmin with ID: ${subadminId}`);
    }
    
    // Create test player if doesn't exist
    const playerCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      ['playertester']
    );
    
    if (playerCheck.rows.length === 0) {
      // Create player under this subadmin
      const playerResult = await pool.query(
        `INSERT INTO users 
        (username, email, password, mobile, role, balance, assigned_to, is_blocked) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id`,
        ['playertester', 'playertester@example.com', hashedPassword, '9876543210', 'player', 5000, subadminId, false]
      );
      
      console.log(`Test player created with ID: ${playerResult.rows[0].id}`);
    } else {
      // Ensure player is assigned to our subadmin
      await pool.query(
        'UPDATE users SET assigned_to = $1 WHERE username = $2',
        [subadminId, 'playertester']
      );
      
      console.log(`Updated player to be assigned to subadmin ID: ${subadminId}`);
    }
    
    // Set custom odds for the subadmin
    // First get the current odds to see if we need to insert or update
    const oddCheck = await pool.query(
      'SELECT * FROM game_odds WHERE game_type = $1 AND subadmin_id = $2',
      ['coin_flip', subadminId]
    );
    
    // Set a custom odd that's different from platform default
    const customOddValue = 210; // 2.10x (stored as 210 in DB)
    
    if (oddCheck.rows.length === 0) {
      // Insert new odd
      await pool.query(
        `INSERT INTO game_odds 
        (game_type, odd_value, set_by_admin, subadmin_id) 
        VALUES ($1, $2, $3, $4)`,
        ['coin_flip', customOddValue, false, subadminId]
      );
    } else {
      // Update existing odd
      await pool.query(
        `UPDATE game_odds 
        SET odd_value = $1 
        WHERE game_type = $2 AND subadmin_id = $3`,
        [customOddValue, 'coin_flip', subadminId]
      );
    }
    
    console.log(`Set custom coin flip odds for subadmin ID ${subadminId} to ${customOddValue/100}x`);
    
    console.log('Test setup completed successfully!');
    console.log('Login credentials:');
    console.log(`Subadmin: username=oddstester, password=${password}`);
    console.log(`Player: username=playertester, password=${password}`);
    
  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    await pool.end();
  }
}

createTestUsers().catch(err => console.error('Unhandled error:', err));