/**
 * This script removes ALL game data from the system, including:
 * - Coin flip games
 * - Satamatka games and markets
 * - Cricket toss games
 * - Team match games and match data
 * 
 * This allows administrators to start with a clean slate
 * and manually add real game data.
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    const client = await pool.connect();
    console.log('Connected to database');
    return client;
  } catch (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
}

async function cleanAllGameData(client) {
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Starting complete game data cleanup...');
    
    // 1. Clean Satamatka data
    console.log('Cleaning Satamatka data...');
    
    // Delete games linked to Satamatka markets
    const satamatkaGamesResult = await client.query(
      'DELETE FROM games WHERE market_id IN (SELECT id FROM satamatka_markets) RETURNING id'
    );
    console.log(`Deleted ${satamatkaGamesResult.rowCount} Satamatka games`);
    
    // Delete all Satamatka markets
    const satamatkaMarketsResult = await client.query('DELETE FROM satamatka_markets RETURNING id');
    console.log(`Deleted ${satamatkaMarketsResult.rowCount} Satamatka markets`);
    
    // 2. Clean Team Match data (including cricket toss)
    console.log('Cleaning Team Match data...');
    
    // Delete games linked to team matches
    const teamMatchGamesResult = await client.query(
      'DELETE FROM games WHERE match_id IN (SELECT id FROM team_matches) RETURNING id'
    );
    console.log(`Deleted ${teamMatchGamesResult.rowCount} Team Match games`);
    
    // Delete all team matches
    const teamMatchesResult = await client.query('DELETE FROM team_matches RETURNING id');
    console.log(`Deleted ${teamMatchesResult.rowCount} Team Matches`);
    
    // 3. Clean Coin Flip and other standalone games
    console.log('Cleaning Coin Flip and other standalone games...');
    
    // Delete all remaining games not linked to matches or markets
    const otherGamesResult = await client.query(
      'DELETE FROM games WHERE market_id IS NULL AND match_id IS NULL RETURNING id'
    );
    console.log(`Deleted ${otherGamesResult.rowCount} standalone games (Coin Flip, etc.)`);
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Successfully cleaned all game data');
    
    // Summary
    const totalGamesRemoved = 
      satamatkaGamesResult.rowCount + 
      teamMatchGamesResult.rowCount + 
      otherGamesResult.rowCount;
    
    console.log('----- Summary -----');
    console.log(`Total games removed: ${totalGamesRemoved}`);
    console.log(`Satamatka markets removed: ${satamatkaMarketsResult.rowCount}`);
    console.log(`Team matches removed: ${teamMatchesResult.rowCount}`);
    console.log('-------------------');
    
  } catch (err) {
    // Roll back transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error cleaning game data:', err);
    throw err;
  }
}

async function main() {
  let client;
  try {
    client = await connectToDatabase();
    await cleanAllGameData(client);
    console.log('Operation completed successfully');
  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
    process.exit(0);
  }
}

main();