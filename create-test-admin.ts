import { db } from './server/db';
import bcrypt from 'bcrypt';
import { users } from './shared/schema';
import { UserRole } from './shared/schema';

async function createTestData() {
  try {
    console.log('Creating test admin and data for risk management testing...');
    
    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin already exists
    const existingAdmin = await db.select().from(users).where({ username: 'testadmin' }).execute();
    
    let adminId: number;
    
    if (existingAdmin.length === 0) {
      const [admin] = await db.insert(users).values({
        username: 'testadmin',
        password: hashedPassword,
        email: 'testadmin@example.com',
        mobile: '1234567890',
        role: UserRole.ADMIN,
        balance: 1000000,
        isBlocked: false
      }).returning();
      
      adminId = admin.id;
      console.log('Created test admin:', admin);
    } else {
      adminId = existingAdmin[0].id;
      console.log('Using existing admin:', existingAdmin[0]);
    }
    
    // Create subadmin
    const existingSubadmin = await db.select().from(users).where({ username: 'testsubadmin' }).execute();
    
    let subadminId: number;
    
    if (existingSubadmin.length === 0) {
      const [subadmin] = await db.insert(users).values({
        username: 'testsubadmin',
        password: hashedPassword,
        email: 'testsubadmin@example.com',
        mobile: '9876543210',
        role: UserRole.SUBADMIN,
        balance: 500000,
        isBlocked: false,
        assignedTo: adminId
      }).returning();
      
      subadminId = subadmin.id;
      console.log('Created test subadmin:', subadmin);
    } else {
      subadminId = existingSubadmin[0].id;
      console.log('Using existing subadmin:', existingSubadmin[0]);
    }
    
    // Create test players
    for (let i = 1; i <= 3; i++) {
      const username = `player${i}`;
      const existingPlayer = await db.select().from(users).where({ username }).execute();
      
      if (existingPlayer.length === 0) {
        const [player] = await db.insert(users).values({
          username,
          password: hashedPassword,
          email: `${username}@example.com`,
          mobile: `555000${i}`,
          role: UserRole.PLAYER,
          balance: 10000 * i,
          isBlocked: false,
          assignedTo: i % 2 === 0 ? adminId : subadminId
        }).returning();
        
        console.log(`Created test player:`, player);
      } else {
        console.log(`Using existing player:`, existingPlayer[0]);
      }
    }
    
    console.log('\nTest accounts created or verified successfully!');
    console.log('Login credentials for all accounts:');
    console.log('Password: admin123');
    console.log('Usernames: testadmin, testsubadmin, player1, player2, player3');
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

// Run the function
createTestData()
  .then(() => console.log('Done!'))
  .catch(err => console.error('Failed:', err))
  .finally(() => process.exit(0));