import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Ensure DATABASE_URL is available from environment variables
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString: dbUrl,
});

// SQL to create tables
const createTableQueries = [
  `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    balance INTEGER NOT NULL DEFAULT 0,
    assigned_to INTEGER REFERENCES users(id),
    is_blocked BOOLEAN NOT NULL DEFAULT false
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS satamatka_markets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    open_time TIMESTAMP NOT NULL,
    close_time TIMESTAMP NOT NULL,
    open_result TEXT,
    close_result TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS team_matches (
    id SERIAL PRIMARY KEY,
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'cricket',
    description TEXT,
    match_time TIMESTAMP NOT NULL,
    result TEXT NOT NULL DEFAULT 'pending',
    odd_team_a INTEGER NOT NULL DEFAULT 200,
    odd_team_b INTEGER NOT NULL DEFAULT 200,
    odd_draw INTEGER DEFAULT 300,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    game_type TEXT NOT NULL DEFAULT 'coin_flip',
    bet_amount INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    result TEXT,
    payout INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    market_id INTEGER REFERENCES satamatka_markets(id),
    match_id INTEGER REFERENCES team_matches(id),
    game_mode TEXT,
    game_data JSONB
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS wallet_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    request_type TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    payment_details JSON NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    proof_image_url TEXT,
    notes TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL,
    performed_by INTEGER NOT NULL REFERENCES users(id),
    request_id INTEGER REFERENCES wallet_requests(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_type TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS subadmin_commissions (
    id SERIAL PRIMARY KEY,
    subadmin_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    commission_rate INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS user_discounts (
    id SERIAL PRIMARY KEY,
    subadmin_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    discount_rate INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
  `,
  `
  CREATE TABLE IF NOT EXISTS game_odds (
    id SERIAL PRIMARY KEY,
    game_type TEXT NOT NULL,
    odd_value INTEGER NOT NULL,
    set_by_admin BOOLEAN DEFAULT TRUE NOT NULL,
    subadmin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )
  `
];

// Insert default admin user
const insertAdminQuery = `
INSERT INTO users (username, password, role, balance)
VALUES ('admin', '$2b$10$1hPrOk0BNl1gk4MzKKBVROnWBk9AWBGxIE/JrTBPPiKLVH0Fdb9zy', 'admin', 1000000)
ON CONFLICT (username) DO NOTHING;
`;

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    console.log('Starting database setup...');
    
    // Create tables
    for (const query of createTableQueries) {
      await client.query(query);
      console.log('Table created successfully');
    }
    
    // Insert admin user
    await client.query(insertAdminQuery);
    console.log('Admin user created (if not exists)');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Database setup completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Release client
    client.release();
    // Close pool
    pool.end();
  }
}

// Run setup
setupDatabase();