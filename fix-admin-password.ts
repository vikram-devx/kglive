/**
 * Script to update the admin user password with the correct crypto.scrypt format
 */
import { pool } from './server/db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Promisify scrypt
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // Use crypto.scrypt format (same as in auth.ts)
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function fixAdminPassword() {
  try {
    console.log('Fixing admin user password...');
    
    // Create admin user with direct SQL
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if admin exists
      const checkResult = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
      
      if (checkResult.rowCount === 0) {
        console.log('Admin user does not exist, creating one');
        // Hash password with crypto.scrypt
        const hashedPassword = await hashPassword('admin123');
        
        await client.query(`
          INSERT INTO users (username, password, email, mobile, role, balance) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['admin', hashedPassword, 'admin@example.com', '1234567890', 'admin', 0]);
        
        console.log('Admin user created successfully with crypto.scrypt password');
      } else {
        console.log('Admin user exists, updating password');
        // Update existing admin's password
        const hashedPassword = await hashPassword('admin123');
        
        await client.query(`
          UPDATE users
          SET password = $1
          WHERE username = 'admin'
        `, [hashedPassword]);
        
        console.log('Admin password updated successfully with crypto.scrypt format');
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error updating admin password:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

fixAdminPassword();