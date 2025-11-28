// Test database storage implementation
import { db } from './server/db';
import { users, User } from './shared/schema';
import { eq } from 'drizzle-orm';

async function testStorage() {
  try {
    console.log("===== TESTING STORAGE =====");
    
    // Direct query to users table
    console.log("Querying users table directly...");
    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users in database:`);
    
    for (const user of allUsers) {
      console.log(`- ${user.username} (ID: ${user.id}, Role: ${user.role})`);
    }
    
    // Try to get admin user specifically
    console.log("\nTrying to get admin user directly...");
    const adminUser = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (adminUser.length > 0) {
      console.log("Admin user found directly via query!");
      console.log("Admin details:", {
        id: adminUser[0].id,
        username: adminUser[0].username,
        role: adminUser[0].role,
        passwordStart: adminUser[0].password.substring(0, 20) + '...'
      });
    } else {
      console.log("Admin user NOT found directly via query!");
    }
    
    console.log("===== TESTING COMPLETE =====");
  } catch (error) {
    console.error("Error testing storage:", error);
  } finally {
    process.exit(0);
  }
}

testStorage();