/**
 * Script to fix the password for the "uloo" user using proper crypto.scrypt hashing
 */
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

// Function to hash a password with crypto.scrypt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

async function fixUlooUser() {
  try {
    console.log('Fixing password for "uloo" user...');
    
    // Hash the password with crypto.scrypt
    const hashedPassword = await hashPassword('asdf1234');
    console.log('Generated new password hash');
    
    // Update the user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'uloo'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length === 0) {
      console.log('User "uloo" not found');
    } else {
      console.log('Updated password successfully for user:', result[0]);
      console.log('You can now login with:');
      console.log('Username: uloo');
      console.log('Password: asdf1234');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

fixUlooUser();