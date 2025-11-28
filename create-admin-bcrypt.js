/**
 * Creates an admin user with bcrypt hashed password
 */

import bcryptjs from 'bcryptjs';
import { pool } from './server/db.js';

async function createAdminWithBcrypt() {
  const client = await pool.connect();
  
  try {
    // Check if admin user exists
    const checkResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    // Generate bcrypt hash for 'admin123'
    const saltRounds = 10;
    const password = 'admin123';
    const hashedPassword = await bcryptjs.hash(password, saltRounds);
    
    if (checkResult.rowCount === 0) {
      // Admin doesn't exist, create one
      console.log('Creating new admin user...');
      
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
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminWithBcrypt();