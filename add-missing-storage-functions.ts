// This script adds missing storage functions to storage.ts
import fs from 'fs';

function addMissingFunctions() {
  try {
    console.log("Adding missing storage functions...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Functions to add
    const functionsToAdd = [
      {
        name: "getGamesByUserId",
        code: `
  async getGamesByUserId(userId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "getGame",
        code: `
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return game;
  }`
      },
      {
        name: "createGame",
        code: `
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games)
      .values(insertGame)
      .returning();
    return game;
  }`
      },
      {
        name: "getGamesByUserIds",
        code: `
  async getGamesByUserIds(userIds: number[]): Promise<Game[]> {
    if (!userIds.length) return [];
    return await db.select()
      .from(games)
      .where(drizzleIn(games.userId, userIds))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "getAllGames",
        code: `
  async getAllGames(limit?: number): Promise<Game[]> {
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
        code: `
  async getRecentGames(userId: number, limit?: number): Promise<Game[]> {
    let query = db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }`
      },
      {
        name: "updateGameStatus",
        code: `
  async updateGameStatus(gameId: number, status: string): Promise<Game | undefined> {
    const [game] = await db.update(games)
      .set({ status })
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }`
      },
      {
        name: "updateGameResult",
        code: `
  async updateGameResult(gameId: number, result: string, payout?: number): Promise<Game | undefined> {
    const updateData: { result: string; payout?: number } = { result };
    if (payout !== undefined) {
      updateData.payout = payout;
    }
    
    const [game] = await db.update(games)
      .set(updateData)
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }`
      }
    ];
    
    // Find a good insertion point - right after the last implemented function
    const insertionPointRegex = /(async getUsersByAssignedTo\([^)]*\)[^{]*{[\s\S]*?})/;
    const match = insertionPointRegex.exec(storageFile);
    
    if (!match) {
      console.log("Couldn't find a suitable insertion point");
      return;
    }
    
    // Get index right after the last implemented function
    const insertionIndex = match.index + match[1].length;
    
    // Create the code to insert
    const codeToInsert = functionsToAdd.map(func => func.code).join('\n');
    
    // Insert the new functions
    const updatedFile = 
      storageFile.slice(0, insertionIndex) + 
      codeToInsert + 
      storageFile.slice(insertionIndex);
    
    // Fix import for drizzleIn if needed
    let finalUpdatedFile = updatedFile;
    if (updatedFile.includes('drizzleIn(') && !updatedFile.includes('drizzleIn,')) {
      finalUpdatedFile = updatedFile.replace(
        /import { (.*?) } from 'drizzle-orm';/,
        "import { $1, drizzleIn } from 'drizzle-orm';"
      );
    }
    
    // Check if 'in as drizzleIn' is in the imports and replace it if so
    if (finalUpdatedFile.includes('in as drizzleIn')) {
      finalUpdatedFile = finalUpdatedFile.replace(
        'in as drizzleIn',
        'drizzleIn'
      );
    }
    
    // Write the updated file
    fs.writeFileSync('./server/storage.ts', finalUpdatedFile);
    console.log("Added missing storage functions to storage.ts");
    
  } catch (error) {
    console.error("Error adding missing functions:", error);
  }
}

addMissingFunctions();