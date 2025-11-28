import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Promisify the scrypt function
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  // Use our native crypto.scrypt function for password hashing
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString('hex')}.${salt}`;
}

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    
    // Hash the password using the same algorithm as in auth.js
    const hashedPassword = await hashPassword('admin123');
    
    // Update the admin user password
    const result = await db.update(users)
      .set({ 
        password: hashedPassword,
      })
      .where(eq(users.username, 'admin'))
      .returning({ id: users.id, username: users.username });
    
    if (result.length > 0) {
      console.log(`Updated admin password for ${result[0].username} (ID: ${result[0].id})`);
      console.log('Please try logging in again with username "admin" and password "admin123"');
    } else {
      console.log('No admin user found!');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  }
}

resetAdminPassword().catch(console.error);