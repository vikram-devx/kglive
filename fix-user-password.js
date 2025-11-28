/**
 * Script to fix a specific user's password with proper crypto.scrypt hashing
 */
const { db } = require('./server/db');
const { users } = require('./shared/schema');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');
const { promisify } = require('util');

const { scrypt, randomBytes } = crypto;

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  // Use our native crypto.scrypt function for password hashing
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString('hex')}.${salt}`;
}

async function fixUserPassword() {
  try {
    console.log('Fixing password for user uloo...');
    
    // First, check if the user exists
    const userResult = await db.select()
      .from(users)
      .where(eq(users.username, 'uloo'));
    
    if (userResult.length === 0) {
      console.log('User "uloo" not found!');
      return;
    }
    
    // Hash the password using crypto.scrypt
    const hashedPassword = await hashPassword('asdf1234');
    
    // Update the user's password
    const result = await db.update(users)
      .set({ 
        password: hashedPassword,
      })
      .where(eq(users.username, 'uloo'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length > 0) {
      console.log(`Updated password for ${result[0].username} (ID: ${result[0].id})`);
      console.log('Please try logging in again with username "uloo" and password "asdf1234"');
    } else {
      console.log('Failed to update password!');
    }
  } catch (error) {
    console.error('Error fixing password:', error);
  }
}

fixUserPassword();