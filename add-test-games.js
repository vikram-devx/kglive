/**
 * This script adds test game data to help test profit/loss calculations
 * It will create sample coin flip games with predefined outcomes
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function addTestGames() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Starting transaction...');
      await client.query('BEGIN');

      // First, get a list of player users
      const usersResult = await client.query(`
        SELECT id, username, role 
        FROM users 
        WHERE role = 'player' AND assigned_to IS NOT NULL
      `);
      
      if (usersResult.rows.length === 0) {
        console.log('No player users found with an assigned subadmin.');
        return;
      }
      
      console.log(`Found ${usersResult.rows.length} player users.`);
      
      // Get the latest balance for each user (should be 0 after reset)
      const players = [];
      for (const user of usersResult.rows) {
        const balanceResult = await client.query(`
          SELECT balance FROM users WHERE id = $1
        `, [user.id]);
        
        players.push({
          ...user,
          balance: balanceResult.rows[0].balance
        });
        
        console.log(`Player ${user.username} (ID: ${user.id}) has balance: ${balanceResult.rows[0].balance}`);
      }
      
      // Add credits to each player first
      for (const player of players) {
        const creditAmount = 1000000; // ₹10,000.00
        await client.query(`
          UPDATE users SET balance = balance + $1 WHERE id = $2
        `, [creditAmount, player.id]);
        
        // Record the transaction
        await client.query(`
          INSERT INTO transactions 
          (user_id, amount, description, performed_by, balance_after, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `, [player.id, creditAmount, 'Deposit for testing', player.id, creditAmount]);
        
        console.log(`Added ${creditAmount} to player ${player.username}`);
      }
      
      // Now create some test games for each player
      const initialBalance = 1000000; // Initial balance after deposit
      for (const player of players) {
        let currentBalance = initialBalance; // Starting with the deposit
        
        // Create 5 winning games
        for (let i = 0; i < 5; i++) {
          const betAmount = 50000; // ₹500.00
          currentBalance -= betAmount; // Deduct bet amount
          const payout = 95000; // ₹950.00 (win)
          currentBalance += payout; // Add payout for wins
          
          console.log(`Creating winning game for ${player.username}, bet: ${betAmount}, payout: ${payout}, balance: ${currentBalance}`);
          
          await client.query(`
            INSERT INTO games
            (user_id, game_type, bet_amount, prediction, result, payout, balance_after, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${5-i} hours')
          `, [player.id, 'coin_flip', betAmount, 'heads', 'win', payout, currentBalance]);
        }
        
        // Create 5 losing games
        for (let i = 0; i < 5; i++) {
          const betAmount = 40000; // ₹400.00
          currentBalance -= betAmount; // Deduct bet amount
          const payout = 0; // ₹0.00 (loss)
          
          console.log(`Creating losing game for ${player.username}, bet: ${betAmount}, payout: ${payout}, balance: ${currentBalance}`);
          
          await client.query(`
            INSERT INTO games
            (user_id, game_type, bet_amount, prediction, result, payout, balance_after, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${i} hours')
          `, [player.id, 'coin_flip', betAmount, 'tails', 'loss', payout, currentBalance]);
        }
      }
      
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

addTestGames()
  .then(() => console.log('Test games have been added successfully.'))
  .catch(err => console.error('Failed to add test games:', err));