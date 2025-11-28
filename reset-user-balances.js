/**
 * This script resets all user balances to zero
 * Use this script for testing profit/loss calculations
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function resetUserBalances() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Starting transaction...');
      await client.query('BEGIN');

      console.log('Resetting all user balances to zero...');
      const updateResult = await client.query(`
        UPDATE users
        SET balance = 0
        WHERE true
      `);
      
      console.log(`Reset balances for ${updateResult.rowCount} users`);
      
      await client.query('COMMIT');
      console.log('Transaction committed successfully!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error occurred, transaction rolled back:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
    console.log('Done. Pool has ended.');
  }
}

resetUserBalances()
  .then(() => console.log('All user balances have been reset to zero.'))
  .catch(err => console.error('Failed to reset user balances:', err));