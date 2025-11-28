/**
 * This script allows selective removal of game data by type
 * You can choose which types of game data to remove:
 * - Coin flip games
 * - Satamatka games and markets
 * - Cricket toss games
 * - Team match games and match data
 * 
 * Usage: node clear-selective-game-data.js [game_types]
 * Where game_types can be one or more of: coinflip, satamatka, crickettoss, teammatch
 * Example: node clear-selective-game-data.js coinflip satamatka
 */

import pg from 'pg';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config();

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Parse command line arguments
const args = process.argv.slice(2);
const validGameTypes = ['coinflip', 'satamatka', 'crickettoss', 'teammatch'];

// If no arguments provided or help requested, show usage
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node clear-selective-game-data.js [game_types]');
  console.log('Where game_types can be one or more of: coinflip, satamatka, crickettoss, teammatch');
  console.log('Example: node clear-selective-game-data.js coinflip satamatka');
  process.exit(0);
}

// Validate arguments
const invalidArgs = args.filter(arg => !validGameTypes.includes(arg));
if (invalidArgs.length > 0) {
  console.error(`Invalid game type(s): ${invalidArgs.join(', ')}`);
  console.log(`Valid game types are: ${validGameTypes.join(', ')}`);
  process.exit(1);
}

// Define what will be deleted based on command line args
const gameTypesToDelete = {
  coinflip: args.includes('coinflip'),
  satamatka: args.includes('satamatka'),
  crickettoss: args.includes('crickettoss'),
  teammatch: args.includes('teammatch')
};

async function clearSelectiveGameData() {
  const client = await pool.connect();
  
  try {
    console.log("Starting selective game data cleanup...");
    console.log(`Game types to remove: ${args.join(', ')}`);
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Delete games by type
    let totalGamesRemoved = 0;
    
    if (gameTypesToDelete.coinflip) {
      console.log("Removing all coin flip games...");
      const result = await client.query('DELETE FROM "games" WHERE "game_type" = $1', ['coin_flip']);
      console.log(`Removed ${result.rowCount} coin flip games`);
      totalGamesRemoved += result.rowCount;
    }
    
    if (gameTypesToDelete.satamatka) {
      console.log("Removing all satamatka games...");
      const result = await client.query('DELETE FROM "games" WHERE "game_type" = $1', ['satamatka']);
      console.log(`Removed ${result.rowCount} satamatka games`);
      totalGamesRemoved += result.rowCount;
      
      // Also delete satamatka markets
      console.log("Removing all satamatka markets...");
      const marketsResult = await client.query('DELETE FROM "satamatka_markets"');
      console.log(`Removed ${marketsResult.rowCount} satamatka markets`);
      
      // Reset satamatka markets sequence if table is empty
      const marketsCount = await client.query('SELECT COUNT(*) FROM "satamatka_markets"');
      if (parseInt(marketsCount.rows[0].count) === 0) {
        console.log("Resetting satamatka_markets sequence counter...");
        await client.query('ALTER SEQUENCE "satamatka_markets_id_seq" RESTART WITH 1');
      }
    }
    
    if (gameTypesToDelete.crickettoss) {
      console.log("Removing all cricket toss games...");
      const result = await client.query('DELETE FROM "games" WHERE "game_type" = $1', ['cricket_toss']);
      console.log(`Removed ${result.rowCount} cricket toss games`);
      totalGamesRemoved += result.rowCount;
    }
    
    if (gameTypesToDelete.teammatch) {
      console.log("Removing all team match games...");
      const result = await client.query('DELETE FROM "games" WHERE "game_type" = $1', ['team_match']);
      console.log(`Removed ${result.rowCount} team match games`);
      totalGamesRemoved += result.rowCount;
      
      // Also delete team matches
      console.log("Removing all team matches...");
      const matchesResult = await client.query('DELETE FROM "team_matches"');
      console.log(`Removed ${matchesResult.rowCount} team matches`);
      
      // Reset team matches sequence if table is empty
      const matchesCount = await client.query('SELECT COUNT(*) FROM "team_matches"');
      if (parseInt(matchesCount.rows[0].count) === 0) {
        console.log("Resetting team_matches sequence counter...");
        await client.query('ALTER SEQUENCE "team_matches_id_seq" RESTART WITH 1');
      }
    }
    
    console.log(`Total games removed: ${totalGamesRemoved}`);
    
    // Check if games table is empty to reset sequence
    const gamesCount = await client.query('SELECT COUNT(*) FROM "games"');
    if (parseInt(gamesCount.rows[0].count) === 0) {
      console.log("Games table is empty, resetting games sequence counter...");
      await client.query('ALTER SEQUENCE "games_id_seq" RESTART WITH 1');
    } else {
      console.log(`Games table still has ${gamesCount.rows[0].count} records, not resetting sequence`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log("Selective game data cleanup completed successfully!");
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error("Error clearing game data:", error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Ask for confirmation before proceeding
console.log(`WARNING: This will permanently delete ${args.join(', ')} game data from the system.`);
console.log("User accounts, balances, and transaction history will be preserved.");

if (gameTypesToDelete.satamatka) {
  console.log("All Satamatka markets will also be deleted.");
}

if (gameTypesToDelete.teammatch) {
  console.log("All team matches will also be deleted.");
}

console.log("Type 'DELETE SELECTED GAME DATA' to confirm, or press Ctrl+C to cancel.");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Confirmation: ', (answer) => {
  if (answer === 'DELETE SELECTED GAME DATA') {
    readline.close();
    
    // Run the cleanup
    clearSelectiveGameData()
      .then(() => {
        console.log("Cleanup script completed successfully. You can now restart the server.");
        process.exit(0);
      })
      .catch(error => {
        console.error("Cleanup script failed:", error);
        process.exit(1);
      });
  } else {
    console.log("Cleanup cancelled. No data was deleted.");
    readline.close();
    process.exit(0);
  }
});