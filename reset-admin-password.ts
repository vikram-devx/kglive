// Script to reset the admin password
import { db } from './server/db';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // Use crypto.scrypt function for password hashing
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  try {
    console.log("Resetting admin password...");
    
    // Create a new password hash for 'admin123'
    const password = 'admin123';
    const hashedPassword = await hashPassword(password);
    
    console.log("New password hash created");
    
    // Update admin user in the database
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ Admin password reset successfully!");
      console.log("You can now login with username 'admin' and password 'admin123'");
    } else {
      console.log("❌ Admin user not found or password reset failed");
    }
    
  } catch (error) {
    console.error("Error resetting admin password:", error);
  }
}

resetAdminPassword();