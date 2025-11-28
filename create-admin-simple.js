import { pool } from './server/db.js';

async function createAdmin() {
  const client = await pool.connect();
  try {
    // Create a simple bcrypt hash for 'admin123'
    const hashedPassword = '$2b$10$6ry7fnztTLJGCEJ.XTfuOOYTi6YkxuCMqN3Zpn9FLrGwKJVbjBQ5i';
    
    // Insert admin directly with SQL to avoid any potential issues
    const result = await client.query(`
      INSERT INTO users (username, password, email, mobile, role, balance, is_blocked)
      VALUES ('admin', $1, 'admin@example.com', '1234567890', 'admin', 0, false)
      RETURNING id, username
    `, [hashedPassword]);
    
    console.log('Created new admin account:', result.rows[0]);
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    client.release();
  }
}

createAdmin().catch(console.error);
