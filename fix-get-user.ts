// This script fixes the storage implementation for getUser
import { db } from './server/db';
import { users, User } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function fixGetUser() {
  try {
    console.log("Fixing getUser method in storage.ts...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Look for the getUser method
    const getUserPattern = /async getUser\([^)]*\)[^{]*{[^}]*}/;
    
    // Check if we found the method
    if (getUserPattern.test(storageFile)) {
      console.log("Found getUser method in storage.ts");
      
      // Create the replacement implementation
      const replacement = `async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }`;
      
      // Replace the implementation
      const updatedFile = storageFile.replace(getUserPattern, replacement);
      
      // Check if the file was updated
      if (updatedFile !== storageFile) {
        // Write the updated file
        fs.writeFileSync('./server/storage.ts', updatedFile);
        console.log("Updated getUser implementation in storage.ts");
      } else {
        console.log("No changes were made to storage.ts");
      }
    } else {
      console.log("Could not find getUser method in storage.ts");
    }
    
    console.log("getUser implementation fix completed!");
  } catch (error) {
    console.error("Error fixing getUser implementation:", error);
  } finally {
    process.exit(0);
  }
}

fixGetUser();