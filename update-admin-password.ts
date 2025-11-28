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

async function updateAdminPassword() {
  try {
    console.log('Updating admin user password...');
    
    // Hash the password with crypto.scrypt
    const hashedPassword = await hashPassword('admin123');
    console.log('Generated new password hash');
    
    // Update the admin user's password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'admin'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length === 0) {
      console.log('Admin user not found');
    } else {
      console.log('Updated admin password successfully:', result[0]);
      console.log('You can now login with:');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error updating admin password:', error);
  }
}

updateAdminPassword();