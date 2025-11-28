/**
 * Creates an admin user with crypto.scrypt password hash
 */
import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function createAdmin() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    // Create admin with crypto.scrypt hash
    // The hash format is: hashedPassword.salt
    const client = await pool.connect();
    
    try {
      // Check if admin exists
      const res = await client.query('SELECT * FROM users WHERE username = $1', ['admin']);
      
      // Create hash for admin123
      const password = 'admin123';
      const salt = crypto.randomBytes(16).toString('hex');
      const buf = await scryptAsync(password, salt, 64);
      const hashedPassword = `${buf.toString('hex')}.${salt}`;
      
      if (res.rows.length === 0) {
        // Admin doesn't exist, create it
        console.log('Creating admin user...');
        
        await client.query(`
          INSERT INTO users (username, password, email, mobile, role, balance)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', hashedPassword, 'admin@example.com', '1234567890', 'admin', 0]);
        
        console.log('Admin user created successfully!');
      } else {
        // Admin exists, update password
        console.log('Admin user exists, updating password...');
        
        await client.query(`
          UPDATE users 
          SET password = $1
          WHERE username = 'admin'
        `, [hashedPassword]);
        
        console.log('Admin password updated successfully!');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();