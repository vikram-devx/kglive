/**
 * This script removes all cricket toss game data from the database.
 * It's part of the process of removing the cricket toss feature from the platform.
 */

import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

async function connectToDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection established');
    return pool;
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
}

async function removeCricketTossData(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check how many cricket toss games exist
    const gameCountResult = await client.query(
      "SELECT COUNT(*) FROM games WHERE game_type = 'cricket_toss'"
    );
    const gameCount = parseInt(gameCountResult.rows[0].count);
    console.log(`Found ${gameCount} cricket toss games to remove`);

    if (gameCount > 0) {
      // 2. Get details of the games for logging
      const gameDetails = await client.query(
        "SELECT id, user_id, bet_amount, prediction, result, created_at FROM games WHERE game_type = 'cricket_toss'"
      );
      console.log('Games to be removed:');
      gameDetails.rows.forEach(game => {
        console.log(`- Game #${game.id} created on ${game.created_at}`);
      });

      // 3. Remove the cricket toss games
      const deleteResult = await client.query(
        "DELETE FROM games WHERE game_type = 'cricket_toss' RETURNING id"
      );
      console.log(`Deleted ${deleteResult.rowCount} cricket toss games`);
    }

    // 4. Remove cricket_toss from game_odds if they exist
    const oddsResult = await client.query(
      "DELETE FROM game_odds WHERE game_type = 'cricket_toss' RETURNING id"
    );
    console.log(`Deleted ${oddsResult.rowCount} cricket toss odds settings`);

    // 5. Remove cricket_toss from subadmin_commissions if they exist
    const commissionsResult = await client.query(
      "DELETE FROM subadmin_commissions WHERE game_type = 'cricket_toss' RETURNING id"
    );
    console.log(`Deleted ${commissionsResult.rowCount} cricket toss commission settings`);

    // 6. Remove any cricket_toss related settings from system_settings if they exist
    const settingsResult = await client.query(
      "DELETE FROM system_settings WHERE setting_key LIKE '%cricket_toss%' RETURNING id"
    );
    console.log(`Deleted ${settingsResult.rowCount} cricket toss system settings`);

    // 7. Check for user_discounts with cricket_toss and remove them
    const discountsResult = await client.query(
      "DELETE FROM user_discounts WHERE game_type = 'cricket_toss' RETURNING id"
    );
    console.log(`Deleted ${discountsResult.rowCount} cricket toss user discounts`);

    await client.query('COMMIT');
    console.log('Cricket toss data cleanup completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing cricket toss data:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  let pool;
  try {
    pool = await connectToDatabase();
    await removeCricketTossData(pool);
    console.log('Cricket toss data cleanup completed');
  } catch (err) {
    console.error('Error in cleanup process:', err);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

main();