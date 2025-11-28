// This script fixes the password format to be compatible with the auth.ts implementation
import { db } from "./server/db";
import { users } from "./shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./server/auth";

async function fixPasswords() {
  try {
    console.log("Fixing password formats...");
    
    // Get all users
    const allUsers = await db.select().from(users);
    
    for (const user of allUsers) {
      console.log(`Fixing password for user: ${user.username}`);
      
      // Hash the password using the auth.ts implementation
      // For demonstration, we'll use default passwords
      const password = user.username === "admin" ? "admin123" : "subadmin123";
      const hashedPassword = await hashPassword(password);
      
      // Update the user's password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
        
      console.log(`Password updated for: ${user.username}`);
    }
    
    console.log("All passwords have been fixed!");
  } catch (error) {
    console.error("Error fixing passwords:", error);
  } finally {
    process.exit(0);
  }
}

fixPasswords();