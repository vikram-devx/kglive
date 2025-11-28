// This script fixes the storage implementation for getUserByUsername
import { db } from './server/db';
import { users, User } from './shared/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function fixStorage() {
  try {
    console.log("Fixing storage.ts implementation...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Look for the getUserByUsername method
    const getUserPattern = /async getUserByUsername\([^)]*\)[^{]*{[^}]*}/;
    
    // Check if we found the method
    if (getUserPattern.test(storageFile)) {
      console.log("Found getUserByUsername method in storage.ts");
      
      // Create the replacement implementation
      const replacement = `async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }`;
      
      // Replace the implementation
      const updatedFile = storageFile.replace(getUserPattern, replacement);
      
      // Check if the file was updated
      if (updatedFile !== storageFile) {
        // Write the updated file
        fs.writeFileSync('./server/storage.ts', updatedFile);
        console.log("Updated getUserByUsername implementation in storage.ts");
      } else {
        console.log("No changes were made to storage.ts");
      }
    } else {
      console.log("Could not find getUserByUsername method in storage.ts");
    }
    
    console.log("Storage implementation fix completed!");
  } catch (error) {
    console.error("Error fixing storage implementation:", error);
  } finally {
    process.exit(0);
  }
}

fixStorage();