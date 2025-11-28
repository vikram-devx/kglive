/**
 * This script creates the game_odds table in the database
 * Run this to fix the game odds error in subadmin management
 */
import 'dotenv/config';
import pg from 'pg';

async function createGameOddsTable() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('Creating game_odds table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_odds (
        id SERIAL PRIMARY KEY,
        game_type TEXT NOT NULL,
        odd_value INTEGER NOT NULL,
        set_by_admin BOOLEAN NOT NULL DEFAULT true,
        subadmin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('game_odds table created successfully!');

    // Adding default game odds
    console.log('Setting up default game odds...');
    
    // Default game types and their odds
    const defaultOdds = [
      { gameType: 'coin_flip', oddValue: 19500 }, // 1.95
      { gameType: 'cricket_toss', oddValue: 19000 }, // 1.90
      { gameType: 'satamatka_jodi', oddValue: 900000 }, // 90.00
      { gameType: 'satamatka_harf', oddValue: 90000 }, // 9.00
      { gameType: 'satamatka_odd_even', oddValue: 19000 }, // 1.90
      { gameType: 'satamatka_crossing', oddValue: 950000 }, // 95.00
    ];
    
    for (const odd of defaultOdds) {
      // We need to modify this because ON CONFLICT requires a unique constraint
      // First check if record exists
      const existingRecord = await client.query(
        'SELECT * FROM game_odds WHERE game_type = $1 AND set_by_admin = true',
        [odd.gameType]
      );
      
      if (existingRecord.rows.length > 0) {
        // Update existing record
        await client.query(
          'UPDATE game_odds SET odd_value = $1, updated_at = NOW() WHERE game_type = $2 AND set_by_admin = true',
          [odd.oddValue, odd.gameType]
        );
      } else {
        // Insert new record
        await client.query(
          'INSERT INTO game_odds (game_type, odd_value, set_by_admin) VALUES ($1, $2, true)',
          [odd.gameType, odd.oddValue]
        );
      }
    }
    
    console.log('Default game odds set up successfully!');
    
  } catch (error) {
    console.error('Error creating game_odds table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createGameOddsTable();