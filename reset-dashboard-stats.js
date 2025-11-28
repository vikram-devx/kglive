/**
 * This script resets all data related to admin dashboard statistics:
 * - Removes all transaction records
 * - Resets admin balance to 0
 * - Clears all game data
 * 
 * Use this for testing dashboard statistics calculation logic
 */

import pg from 'pg';
const { Pool } = pg;

async function resetDashboardStats() {
  // Connect to database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connected to database. Starting reset process...');
    
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Clear all transactions
      console.log('Removing all transaction records...');
      await client.query('DELETE FROM transactions');
      
      // 2. Reset admin balance to 0
      console.log('Resetting admin balance to 0...');
      await client.query('UPDATE users SET balance = 0 WHERE role = \'admin\'');
      
      // 3. Remove all games
      console.log('Removing all game records...');
      await client.query('DELETE FROM games');
      
      // 4. Also reset the balances of all subadmins
      console.log('Resetting subadmin balances to 0...');
      await client.query('UPDATE users SET balance = 0 WHERE role = \'subadmin\'');
      
      await client.query('COMMIT');
      console.log('Dashboard statistics data reset complete!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error during reset process:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

// Execute the reset function
resetDashboardStats().catch(err => {
  console.error('Failed to reset dashboard statistics:', err);
  process.exit(1);
});