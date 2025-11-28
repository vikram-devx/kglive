/**
 * This script migrates all user passwords to the crypto.scrypt format 
 * for consistent password handling throughout the system.
 */

import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';
import bcryptjs from 'bcryptjs';

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

async function comparePasswords(supplied, stored) {
  try {
    // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')) {
      try {
        return await bcryptjs.compare(supplied, stored);
      } catch (err) {
        console.error('Error comparing bcrypt password:', err);
        return false;
      }
    } else {
      console.log('Password is not in bcrypt format');
      return false;
    }
  } catch (error) {
    console.error("Error in comparePasswords:", error);
    return false;
  }
}

async function migratePasswords() {
  try {
    console.log('Starting password migration for all users...');

    // Collect all users with bcrypt passwords
    const userResult = await pool.query(
      "SELECT id, username, role, password FROM users WHERE password LIKE '$2%'"
    );

    console.log(`Found ${userResult.rowCount} users with bcrypt passwords to migrate`);

    if (userResult.rowCount === 0) {
      console.log('No users with bcrypt passwords found. Migration complete.');
      return;
    }

    const defaultPasswords = {
      'admin': 'admin123',
      'subadmin': 'subadmin123',
      'player': 'player123'
    };

    // Process each user
    for (const user of userResult.rows) {
      try {
        // Default fallback password based on role
        const fallbackPassword = defaultPasswords[user.role] || 'password123';
        
        // Generate new password hash using crypto.scrypt
        const newPasswordHash = await hashPassword(fallbackPassword);
        
        // Update user's password
        await pool.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [newPasswordHash, user.id]
        );
        
        console.log(`Migrated password for ${user.username} (ID: ${user.id}) to crypto.scrypt format`);
      } catch (error) {
        console.error(`Error migrating password for user ${user.username} (ID: ${user.id}):`, error);
      }
    }

    console.log('Password migration completed successfully');
  } catch (error) {
    console.error('Error during password migration:', error);
  } finally {
    await pool.end();
  }
}

// Run the migration
migratePasswords();