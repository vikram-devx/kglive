/**
 * This script removes all game data with no interactive confirmation.
 * Designed for use in automated scripts or development environments.
 * 
 * It removes:
 * - Games (all types: coin flip, Satamatka, cricket toss, team match)
 * - Team matches
 * - Satamatka markets
 * 
 * While preserving:
 * - User accounts and balances
 * - Transactions (wallet history)
 * - System settings
 * - Commissions and odds
 */

import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetGameData() {
  const client = await pool.connect();
  
  try {
    console.log("Starting game data reset...");
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Delete all games in specific order to avoid foreign key issues
    const gameTypes = ['coin_flip', 'satamatka', 'cricket_toss', 'team_match'];
    
    let totalGamesRemoved = 0;
    for (const gameType of gameTypes) {
      const deleteResult = await client.query('DELETE FROM "games" WHERE "game_type" = $1', [gameType]);
      console.log(`Removed ${deleteResult.rowCount} ${gameType} games`);
      totalGamesRemoved += deleteResult.rowCount;
    }
    
    // Delete team matches
    const deleteTeamMatchesResult = await client.query('DELETE FROM "team_matches"');
    console.log(`Removed ${deleteTeamMatchesResult.rowCount} team matches`);
    
    // Delete Satamatka markets
    const deleteSatamatkaMarketsResult = await client.query('DELETE FROM "satamatka_markets"');
    console.log(`Removed ${deleteSatamatkaMarketsResult.rowCount} Satamatka markets`);
    
    // Reset sequence counters
    await client.query('ALTER SEQUENCE "games_id_seq" RESTART WITH 1');
    await client.query('ALTER SEQUENCE "team_matches_id_seq" RESTART WITH 1');
    await client.query('ALTER SEQUENCE "satamatka_markets_id_seq" RESTART WITH 1');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log("Game data reset completed successfully!");
    console.log(`Total records removed: ${totalGamesRemoved + deleteTeamMatchesResult.rowCount + deleteSatamatkaMarketsResult.rowCount}`);
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error("Error resetting game data:", error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

// Run the reset
resetGameData()
  .then(() => {
    console.log("Game data has been completely reset.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Reset script failed:", error);
    process.exit(1);
  });