import { db } from './server/db';
import bcrypt from 'bcrypt';
import { users } from './shared/schema';
import { UserRole } from './shared/schema';

async function createAdminUser() {
  try {
    console.log('Creating simple admin user for testing...');
    
    // Hash password
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert admin user directly
    const [admin] = await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      mobile: '1234567890',
      role: UserRole.ADMIN,
      balance: 1000000,
      isBlocked: false
    }).returning();
    
    console.log('Created admin user:', admin);
    console.log('Login with:');
    console.log('Username: admin');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Run the function
createAdminUser()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Failed:', err));