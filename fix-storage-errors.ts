// This script fixes errors in the storage.ts file
import fs from 'fs';

function fixStorageErrors() {
  try {
    console.log("Fixing errors in storage.ts...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Fix error with updateData in the updateTeamMatch function
    const errorPattern = /async updateTeamMatch\(id: number, data: Partial<InsertTeamMatch>\): Promise<TeamMatch \| undefined> {[^}]*}/gs;
    const correctImplementation = `async updateTeamMatch(id: number, data: Partial<InsertTeamMatch>): Promise<TeamMatch | undefined> {
    const [updatedMatch] = await db.update(teamMatches)
      .set(data)
      .where(eq(teamMatches.id, id))
      .returning();
    
    return updatedMatch;
  }`;
    
    let updatedFile = storageFile.replace(errorPattern, correctImplementation);
    
    // Write the updated file
    fs.writeFileSync('./server/storage.ts', updatedFile);
    console.log("Fixed errors in storage.ts");
    
  } catch (error) {
    console.error("Error fixing storage.ts:", error);
  }
}

fixStorageErrors();