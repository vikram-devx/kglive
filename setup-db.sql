-- Create users table first
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  role TEXT NOT NULL DEFAULT 'player',
  balance INTEGER NOT NULL DEFAULT 0,
  assigned_to INTEGER REFERENCES users(id),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_by INTEGER REFERENCES users(id)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY NOT NULL,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create index on sessions.expire
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Create satamatka_markets table
CREATE TABLE IF NOT EXISTS satamatka_markets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  open_time TIMESTAMP NOT NULL,
  close_time TIMESTAMP NOT NULL,
  result_time TIMESTAMP,
  open_result TEXT,
  close_result TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_pattern TEXT DEFAULT 'daily',
  last_resulted_date TIMESTAMP,
  next_open_time TIMESTAMP,
  next_close_time TIMESTAMP,
  cover_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create team_matches table
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
  team_a_image TEXT,
  team_b_image TEXT,
  cover_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  game_type TEXT NOT NULL DEFAULT 'coin_flip',
  bet_amount INTEGER NOT NULL,
  prediction TEXT NOT NULL,
  result TEXT,
  payout INTEGER NOT NULL DEFAULT 0,
  balance_after INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  market_id INTEGER REFERENCES satamatka_markets(id),
  match_id INTEGER REFERENCES team_matches(id),
  game_mode TEXT,
  game_data JSONB
);

-- Create wallet_requests table
CREATE TABLE IF NOT EXISTS wallet_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  request_type TEXT NOT NULL,
  payment_mode TEXT NOT NULL,
  payment_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  proof_image_url TEXT,
  notes TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  description TEXT,
  request_id INTEGER REFERENCES wallet_requests(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create player_deposit_discounts table
CREATE TABLE IF NOT EXISTS player_deposit_discounts (
  id SERIAL PRIMARY KEY,
  subadmin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_rate INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (username, password, email, mobile, role, balance)
VALUES ('admin', '$2b$10$1hPrOk0BNl1gk4MzKKBVROnWBk9AWBGxIE/JrTBPPiKLVH0Fdb9zy', 'admin@example.com', '1234567890', 'admin', 1000000)
ON CONFLICT (username) DO NOTHING;