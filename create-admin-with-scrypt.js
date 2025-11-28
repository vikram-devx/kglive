// This script creates an admin user with a crypto.scrypt password hash format that matches the application's authentication system

import { pool } from './server/db.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Promisify scrypt
const scryptAsync = promisify(scrypt);

// Function to hash password with crypto.scrypt
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${derivedKey.toString('hex')}.${salt}`;
}

async function createAdmin() {
  try {
    console.log('Creating admin with scrypt password...');
    
    // Generate a scrypt hash for 'admin123'
    const hashedPassword = await hashPassword('admin123');
    console.log('Generated hash:', hashedPassword);
    
    // Connect to database
    const client = await pool.connect();
    
    try {
      // First delete any existing admin user
      await client.query(`DELETE FROM users WHERE username = 'admin'`);
      
      // Insert the new admin user
      const result = await client.query(`
        INSERT INTO users (username, password, email, mobile, role, balance, is_blocked)
        VALUES ('admin', $1, 'admin@example.com', '1234567890', 'admin', 0, false)
        RETURNING id, username
      `, [hashedPassword]);
      
      console.log('Created new admin account:', result.rows[0]);
      console.log('You can now login with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Run the script
createAdmin();