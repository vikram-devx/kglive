// This script implements all the missing storage functions
import fs from 'fs';

function implementAllFunctions() {
  try {
    console.log("Implementing all storage functions...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Functions to implement
    const functionsToImplement = [
      {
        name: "getAllUsers",
        pattern: /async getAllUsers\(\)[^{]*{[^}]*}/,
        implementation: `async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }`
      },
      {
        name: "getUsersByAssignedTo",
        pattern: /async getUsersByAssignedTo\([^)]*\)[^{]*{[^}]*}/,
        implementation: `async getUsersByAssignedTo(assignedToId: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.assignedTo, assignedToId));
  }`
      },
      {
        name: "getGamesByUserId",
        pattern: /async getGamesByUserId\([^)]*\)[^{]*{[^}]*}/,
        implementation: `async getGamesByUserId(userId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "getGamesByUserIds",
        pattern: /async getGamesByUserIds\([^)]*\)[^{]*{[^}]*}/,
        implementation: `async getGamesByUserIds(userIds: number[]): Promise<Game[]> {
    if (!userIds.length) return [];
    return await db.select()
      .from(games)
      .where(drizzleIn(games.userId, userIds))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "getAllGames",
        pattern: /async getAllGames\([^)]*\)[^{]*{[^}]*}/,
        implementation: `async getAllGames(limit?: number): Promise<Game[]> {
    let query = db.select()
      .from(games)
      .orderBy(desc(games.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }`
      },
      {
        name: "getRecentGames",
        pattern: /async getRecentGames\([^)]*\)[^{]*{[^}]*}/,
        implementation: `async getRecentGames(userId: number, limit?: number): Promise<Game[]> {
    let query = db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }`
      }
    ];
    
    let updatedFile = storageFile;
    
    // Replace each function implementation
    for (const func of functionsToImplement) {
      console.log(`Implementing ${func.name}...`);
      
      if (func.pattern.test(updatedFile)) {
        updatedFile = updatedFile.replace(func.pattern, func.implementation);
        console.log(`Implemented ${func.name} successfully`);
      } else {
        console.log(`Could not find ${func.name} in storage.ts`);
      }
    }
    
    // Check if we made any changes
    if (updatedFile !== storageFile) {
      // Fix import for drizzleIn
      if (updatedFile.includes('drizzleIn') && !updatedFile.includes('drizzleIn(')) {
        updatedFile = updatedFile.replace(
          "import { eq, desc, and, lt, gt, gte, lte, ne, isNotNull, or, sql, asc, count, in as drizzleIn, isNull, like, not } from 'drizzle-orm';",
          "import { eq, desc, and, lt, gt, gte, lte, ne, isNotNull, or, sql, asc, count, isNull, like, not, drizzleIn } from 'drizzle-orm';"
        );
      }
      
      // Write the updated file
      fs.writeFileSync('./server/storage.ts', updatedFile);
      console.log("Updated storage.ts with all function implementations");
    } else {
      console.log("No changes were made to storage.ts");
    }
    
    console.log("Storage implementation complete!");
  } catch (error) {
    console.error("Error implementing storage functions:", error);
  }
}

implementAllFunctions();