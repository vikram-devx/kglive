/**
 * This script updates the admin and subadmin passwords to work with the new 
 * dual-format password system (crypto.scrypt).
 */

import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';

// Promisify the scrypt function
const scryptAsync = promisify(crypto.scrypt);

// Connect to the database
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Function to hash password with crypto.scrypt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPasswords() {
  try {
    console.log('Starting password reset for admin and subadmin accounts...');

    // Hash the passwords
    const adminPasswordHash = await hashPassword('admin123');
    const subadminPasswordHash = await hashPassword('subadmin123');

    // Update admin password (assuming id=1 for admin)
    const adminResult = await pool.query(
      'UPDATE users SET password = $1 WHERE role = $2 AND id = $3 RETURNING id, username, role',
      [adminPasswordHash, 'admin', 1]
    );

    if (adminResult.rows.length > 0) {
      console.log(`Reset password for admin user: ${adminResult.rows[0].username}`);
    } else {
      console.log('Admin user not found or not updated');
    }

    // Update subadmin passwords (all users with role=subadmin)
    const subadminResult = await pool.query(
      'UPDATE users SET password = $1 WHERE role = $2 RETURNING id, username, role',
      [subadminPasswordHash, 'subadmin']
    );

    console.log(`Reset passwords for ${subadminResult.rowCount} subadmin users`);
    subadminResult.rows.forEach(user => {
      console.log(`- ${user.username} (ID: ${user.id})`);
    });

    console.log('Password reset completed successfully');
  } catch (error) {
    console.error('Error resetting passwords:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
resetAdminPasswords();