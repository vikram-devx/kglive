/**
 * Script to update a subadmin password to make it work with the authentication system
 */
import { pool, db } from './server/db';
import { hashPassword } from './server/auth';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

async function fixSubadminPassword() {
  console.log('Updating subadmin password...');
  
  try {
    // Check if the user exists
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.username, 'shubham'));
    
    if (existingUsers.length === 0) {
      console.log("User 'shubham' not found in the database.");
      return;
    }
    
    // Generate a proper crypto.scrypt hash for 'asdf1234'
    const hashedPassword = await hashPassword('asdf1234');
    console.log('Generated hash:', hashedPassword);
    
    // Update the password
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, 'shubham'))
      .returning();
    
    if (result.length > 0) {
      console.log('Updated password for user:', result[0].username);
      console.log('You can now login with:');
      console.log('Username: shubham');
      console.log('Password: asdf1234');
    } else {
      console.log('No user was updated.');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  }
}

// Run the script
fixSubadminPassword().catch(console.error);