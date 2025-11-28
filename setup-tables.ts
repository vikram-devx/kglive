import { db } from "./server/db";
import { SQL, sql } from "drizzle-orm";

async function setupTables() {
  try {
    console.log("Creating tables if they don't exist...");
    
    // Check if tables exist
    const tablesQuery = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    const existingTables = tablesQuery.rows.map((row: any) => row.table_name);
    console.log("Existing tables:", existingTables);

    // Create player_deposit_discounts table if it doesn't exist
    if (!existingTables.includes('player_deposit_discounts')) {
      console.log("Creating player_deposit_discounts table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS player_deposit_discounts (
          id SERIAL PRIMARY KEY,
          subadmin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          discount_rate INTEGER NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log("Created player_deposit_discounts table.");
    } else {
      console.log("player_deposit_discounts table already exists.");
    }

    console.log("Table setup complete.");
  } catch (error) {
    console.error("Error setting up tables:", error);
  } finally {
    process.exit(0);
  }
}

setupTables();