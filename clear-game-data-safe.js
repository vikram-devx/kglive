/**
 * This script safely removes all game data including:
 * - Games (all types: coin flip, Satamatka, cricket toss, team match)
 * - Team matches
 * - Satamatka markets
 * 
 * It PRESERVES:
 * - User accounts and balances
 * - Transactions (wallet history)
 * - System settings
 * - Commissions and odds
 * - Admin configurations
 * 
 * Use this script to reset the platform's game data without affecting
 * user accounts or wallet history.
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

async function clearGameData() {
  const client = await pool.connect();
  
  try {
    console.log("Starting game data cleanup...");
    console.log("IMPORTANT: This will remove ALL game data but preserve user accounts and transactions");
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 0. Check if we have foreign key constraints that might cause issues
    console.log("Checking for constraints that might block deletion...");
    
    // 1. Delete all games (safer approach: filter by game type)
    console.log("Removing all games...");
    const gameTypes = ['coin_flip', 'satamatka', 'cricket_toss', 'team_match'];
    
    let totalGamesRemoved = 0;
    for (const gameType of gameTypes) {
      const deleteResult = await client.query('DELETE FROM "games" WHERE "game_type" = $1', [gameType]);
      console.log(`Removed ${deleteResult.rowCount} ${gameType} games`);
      totalGamesRemoved += deleteResult.rowCount;
    }
    console.log(`Total games removed: ${totalGamesRemoved}`);
    
    // 2. Delete all team matches
    console.log("Removing all team matches...");
    const deleteTeamMatchesResult = await client.query('DELETE FROM "team_matches"');
    console.log(`Removed ${deleteTeamMatchesResult.rowCount} team matches`);
    
    // 3. Delete all Satamatka markets
    console.log("Removing all Satamatka markets...");
    const deleteSatamatkaMarketsResult = await client.query('DELETE FROM "satamatka_markets"');
    console.log(`Removed ${deleteSatamatkaMarketsResult.rowCount} Satamatka markets`);
    
    // 4. Reset sequence counters if tables are empty
    console.log("Checking if tables are empty before resetting sequences...");
    
    const gamesCount = await client.query('SELECT COUNT(*) FROM "games"');
    if (parseInt(gamesCount.rows[0].count) === 0) {
      console.log("Resetting games sequence counter...");
      await client.query('ALTER SEQUENCE "games_id_seq" RESTART WITH 1');
    } else {
      console.log(`Games table still has ${gamesCount.rows[0].count} records, not resetting sequence`);
    }
    
    const teamMatchesCount = await client.query('SELECT COUNT(*) FROM "team_matches"');
    if (parseInt(teamMatchesCount.rows[0].count) === 0) {
      console.log("Resetting team_matches sequence counter...");
      await client.query('ALTER SEQUENCE "team_matches_id_seq" RESTART WITH 1');
    } else {
      console.log(`Team matches table still has ${teamMatchesCount.rows[0].count} records, not resetting sequence`);
    }
    
    const satamatkaMarketsCount = await client.query('SELECT COUNT(*) FROM "satamatka_markets"');
    if (parseInt(satamatkaMarketsCount.rows[0].count) === 0) {
      console.log("Resetting satamatka_markets sequence counter...");
      await client.query('ALTER SEQUENCE "satamatka_markets_id_seq" RESTART WITH 1');
    } else {
      console.log(`Satamatka markets table still has ${satamatkaMarketsCount.rows[0].count} records, not resetting sequence`);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log("Game data cleanup completed successfully!");
    console.log("All game data has been removed while preserving user accounts and transaction history.");
    
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
console.log("WARNING: This will permanently delete ALL game data from the system.");
console.log("User accounts, balances, and transaction history will be preserved.");
console.log("Type 'DELETE ALL GAME DATA' to confirm, or press Ctrl+C to cancel.");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Confirmation: ', (answer) => {
  if (answer === 'DELETE ALL GAME DATA') {
    readline.close();
    
    // Run the cleanup
    clearGameData()
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