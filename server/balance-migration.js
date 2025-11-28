/**
 * This script will update historical game data to populate the balanceAfter field
 * for games where this data is missing.
 */
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a new pool with the DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateBalanceData() {
  console.log('Starting balance migration process...');
  
  // Get connection from pool
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Query users first
    const usersResult = await client.query(
      'SELECT id, username, balance FROM users WHERE role = $1 ORDER BY id ASC',
      ['player']
    );
    
    const users = usersResult.rows;
    console.log(`Found ${users.length} player accounts to process`);
    
    // Process each user
    for (const user of users) {
      console.log(`\nProcessing user: ${user.username} (ID: ${user.id})`);
      
      // Get all games for this user, ordered by creation date
      const gamesResult = await client.query(
        'SELECT id, bet_amount, payout, balance_after, created_at FROM games WHERE user_id = $1 ORDER BY created_at ASC',
        [user.id]
      );
      
      const games = gamesResult.rows;
      console.log(`Found ${games.length} games for this user`);
      
      if (games.length === 0) {
        console.log('No games to update for this user');
        continue;
      }
      
      // Track user balance as we go through their games
      let runningBalance = user.balance;
      let updatedGamesCount = 0;
      
      // Start from the most recent game and work backwards
      for (let i = games.length - 1; i >= 0; i--) {
        const game = games[i];
        
        // Skip games that already have balanceAfter set
        if (game.balance_after !== null) {
          console.log(`Game ${game.id} already has balance_after: ${game.balance_after}`);
          continue;
        }
        
        // Calculate what the balance would have been before this game
        // by removing the payout and adding back the bet amount
        const balanceBefore = runningBalance - (game.payout || 0) + game.bet_amount;
        
        // Update runningBalance for the next (earlier) game
        runningBalance = balanceBefore;
        
        // The balance after this game would be what we just calculated as balanceBefore
        // plus payout and minus bet_amount
        const calculatedBalanceAfter = balanceBefore - game.bet_amount + (game.payout || 0);
        
        // Update this game's balanceAfter
        await client.query(
          'UPDATE games SET balance_after = $1 WHERE id = $2',
          [calculatedBalanceAfter, game.id]
        );
        
        console.log(`Updated game ${game.id}: Set balance_after to ${calculatedBalanceAfter}`);
        updatedGamesCount++;
      }
      
      console.log(`Updated ${updatedGamesCount} games for user ${user.username}`);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\nBalance migration completed successfully!');
    
  } catch (error) {
    // Rollback the transaction on error
    await client.query('ROLLBACK');
    console.error('Error during balance migration:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the migration
migrateBalanceData()
  .then(() => {
    console.log('Migration process completed successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });