/**
 * This script removes all game data including:
 * - Games (all types: coin flip, Satamatka, cricket toss, team match)
 * - Team matches
 * - Satamatka markets
 * 
 * It does NOT affect:
 * - User accounts
 * - User balances
 * - System settings
 * - Commissions
 * - Odds
 */

import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function clearGameData() {
  const client = await pool.connect();
  
  try {
    console.log("Starting game data cleanup...");
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Delete all games (will cascade to game-specific data)
    console.log("Removing all games...");
    const deleteGamesResult = await client.query('DELETE FROM "games"');
    console.log(`Removed ${deleteGamesResult.rowCount} games`);
    
    // 2. Delete all team matches
    console.log("Removing all team matches...");
    const deleteTeamMatchesResult = await client.query('DELETE FROM "team_matches"');
    console.log(`Removed ${deleteTeamMatchesResult.rowCount} team matches`);
    
    // 3. Delete all Satamatka markets
    console.log("Removing all Satamatka markets...");
    const deleteSatamatkaMarketsResult = await client.query('DELETE FROM "satamatka_markets"');
    console.log(`Removed ${deleteSatamatkaMarketsResult.rowCount} Satamatka markets`);
    
    // Update sequences to reflect empty tables
    console.log("Resetting sequence counters...");
    await client.query('ALTER SEQUENCE "games_id_seq" RESTART WITH 1');
    await client.query('ALTER SEQUENCE "team_matches_id_seq" RESTART WITH 1');
    await client.query('ALTER SEQUENCE "satamatka_markets_id_seq" RESTART WITH 1');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log("Game data cleanup completed successfully!");
    
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

// Run the cleanup
clearGameData()
  .then(() => {
    console.log("Cleanup script completed. You can now restart the server to initialize with clean game data.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Cleanup script failed:", error);
    process.exit(1);
  });