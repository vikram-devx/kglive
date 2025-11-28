/**
 * Quick fix for aloo user password
 */
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function fixAlooPassword() {
  try {
    // Hash the password properly
    const hashedPassword = await hashPassword('qwer1234');
    console.log('Generated hash:', hashedPassword);
    
    // Update the password in database
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'aloo'))
      .returning();
    
    if (result.length > 0) {
      console.log('✓ Password updated successfully for user:', result[0].username);
      console.log('✓ You can now login with username: aloo, password: qwer1234');
    } else {
      console.log('❌ No user was updated');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAlooPassword();