// Import the necessary modules
import { pool, db } from './server/db.js';
import { users } from './shared/schema.js';
import { UserRole } from './shared/schema.js';
import bcrypt from 'bcrypt';

async function createTestAdmin() {
  console.log('Creating test admin account...');
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Insert new admin
    const [newAdmin] = await db.insert(users)
      .values({
        username: 'testadmin',
        password: hashedPassword,
        email: 'testadmin@example.com',
        mobile: '1234567890',
        role: UserRole.ADMIN,
        balance: 1000000, // 10,000 balance for testing
        isBlocked: false
      })
      .returning();
    
    console.log('Created test admin account:', newAdmin);
    console.log('You can now login with:');
    console.log('Username: testadmin');
    console.log('Password: admin123');
    
    // Create a test subadmin
    const [newSubadmin] = await db.insert(users)
      .values({
        username: 'testsubadmin',
        password: hashedPassword,
        email: 'testsubadmin@example.com',
        mobile: '9876543210',
        role: UserRole.SUBADMIN,
        balance: 500000, // 5,000 balance
        isBlocked: false,
        assignedTo: newAdmin.id
      })
      .returning();
      
    console.log('Created test subadmin account:', newSubadmin);
    console.log('You can now login with:');
    console.log('Username: testsubadmin');
    console.log('Password: admin123');
    
    // Create some test players
    for (let i = 1; i <= 5; i++) {
      const [player] = await db.insert(users)
        .values({
          username: `player${i}`,
          password: hashedPassword,
          email: `player${i}@example.com`,
          mobile: `555000${i}`,
          role: UserRole.PLAYER,
          balance: 10000 * i, // Different balances for testing
          isBlocked: false,
          assignedTo: i % 2 === 0 ? newAdmin.id : newSubadmin.id // Assign to either admin or subadmin
        })
        .returning();
        
      console.log(`Created player${i} account:`, player);
    }
    
    console.log('Test accounts created successfully!');
  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

createTestAdmin().catch(console.error);