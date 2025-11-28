/**
 * Script to fix the password for user "uloo" using proper crypto.scrypt hashing
 */
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { promisify } from 'util';

// Promisify scrypt
const scryptAsync = promisify(crypto.scrypt);

// Function to hash password with crypto.scrypt
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function fixUlooPassword() {
  try {
    console.log('Fixing password for user uloo...');
    
    // Hash the password using crypto.scrypt
    const hashedPassword = await hashPassword('asdf1234');
    console.log('Generated new password hash:', hashedPassword.substring(0, 15) + '...');
    
    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'uloo'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length > 0) {
      console.log(`Updated password for ${result[0].username} (ID: ${result[0].id})`);
      console.log('Please try logging in again with username "uloo" and password "asdf1234"');
    } else {
      console.log('User "uloo" not found or password update failed');
    }
  } catch (error) {
    console.error('Error fixing password:', error);
  }
}

// Run the script
fixUlooPassword();