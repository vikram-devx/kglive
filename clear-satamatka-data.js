/**
 * This script removes all Satamatka market data from the database,
 * including all related games. This allows admins to start fresh
 * with manual market creation.
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

async function removeSatamatkaData(client) {
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // First, get all market IDs
    const marketResult = await client.query('SELECT id FROM satamatka_markets');
    const marketIds = marketResult.rows.map(row => row.id);
    
    console.log(`Found ${marketIds.length} Satamatka markets to remove`);
    
    if (marketIds.length > 0) {
      // Remove all games related to Satamatka markets
      const gameDeleteResult = await client.query(
        'DELETE FROM games WHERE market_id IN (SELECT id FROM satamatka_markets)'
      );
      console.log(`Deleted ${gameDeleteResult.rowCount} Satamatka game entries`);
      
      // Remove all Satamatka markets
      const marketDeleteResult = await client.query('DELETE FROM satamatka_markets');
      console.log(`Deleted ${marketDeleteResult.rowCount} Satamatka markets`);
    } else {
      console.log('No Satamatka markets found to delete');
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Successfully removed all Satamatka market data');
    
  } catch (err) {
    // Roll back transaction in case of error
    await client.query('ROLLBACK');
    console.error('Error removing Satamatka data:', err);
    throw err;
  }
}

async function main() {
  let client;
  try {
    client = await connectToDatabase();
    await removeSatamatkaData(client);
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