import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { UserRole } from './shared/schema.js';
import bcryptjs from 'bcryptjs';

async function createFreshAdmin() {
  try {
    console.log('Creating fresh admin account...');
    
    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('admin123', salt);
    
    // Insert new admin
    const result = await db.insert(users)
      .values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        mobile: '1234567890',
        role: UserRole.ADMIN,
        balance: 0,
        isBlocked: false
      })
      .returning();
    
    console.log('Created new admin account:', result[0]);
    console.log('You can now login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
}

createFreshAdmin().catch(console.error);