// This script adds the rest of the storage functions to storage.ts
import fs from 'fs';

function addRestOfFunctions() {
  try {
    console.log("Adding remaining storage functions...");
    
    // Read the storage.ts file
    const storageFile = fs.readFileSync('./server/storage.ts', 'utf8');
    
    // Functions to add
    const functionsToAdd = [
      {
        name: "satamatkaMarketsFunctions",
        code: `
  // Satamatka Market methods
  async createSatamatkaMarket(market: InsertSatamatkaMarket): Promise<SatamatkaMarket> {
    const [createdMarket] = await db.insert(satamatkaMarkets)
      .values(market)
      .returning();
    return createdMarket;
  }

  async getSatamatkaMarket(id: number): Promise<SatamatkaMarket | undefined> {
    const [market] = await db.select()
      .from(satamatkaMarkets)
      .where(eq(satamatkaMarkets.id, id))
      .limit(1);
    return market;
  }

  async getAllSatamatkaMarkets(): Promise<SatamatkaMarket[]> {
    return await db.select()
      .from(satamatkaMarkets)
      .orderBy(desc(satamatkaMarkets.createdAt));
  }

  async getActiveSatamatkaMarkets(): Promise<SatamatkaMarket[]> {
    return await db.select()
      .from(satamatkaMarkets)
      .where(
        or(
          eq(satamatkaMarkets.status, MarketStatus.OPEN),
          eq(satamatkaMarkets.status, MarketStatus.WAITING)
        )
      )
      .orderBy(desc(satamatkaMarkets.createdAt));
  }

  async updateSatamatkaMarketResults(id: number, openResult?: string, closeResult?: string): Promise<SatamatkaMarket | undefined> {
    const updateData: Partial<SatamatkaMarket> = {};
    
    if (openResult !== undefined) {
      updateData.openResult = openResult;
    }
    
    if (closeResult !== undefined) {
      updateData.closeResult = closeResult;
    }
    
    const [updatedMarket] = await db.update(satamatkaMarkets)
      .set(updateData)
      .where(eq(satamatkaMarkets.id, id))
      .returning();
    
    return updatedMarket;
  }

  async updateSatamatkaMarketStatus(id: number, status: string): Promise<SatamatkaMarket | undefined> {
    const [updatedMarket] = await db.update(satamatkaMarkets)
      .set({ status })
      .where(eq(satamatkaMarkets.id, id))
      .returning();
    
    return updatedMarket;
  }

  async getSatamatkaGamesByMarketId(marketId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.marketId, marketId))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "teamMatchesFunctions",
        code: `
  // Team Match methods
  async createTeamMatch(match: InsertTeamMatch): Promise<TeamMatch> {
    const [createdMatch] = await db.insert(teamMatches)
      .values(match)
      .returning();
    return createdMatch;
  }

  async getTeamMatch(id: number): Promise<TeamMatch | undefined> {
    const [match] = await db.select()
      .from(teamMatches)
      .where(eq(teamMatches.id, id))
      .limit(1);
    return match;
  }

  async getAllTeamMatches(): Promise<TeamMatch[]> {
    return await db.select()
      .from(teamMatches)
      .orderBy(desc(teamMatches.createdAt));
  }

  async getActiveTeamMatches(): Promise<TeamMatch[]> {
    return await db.select()
      .from(teamMatches)
      .where(eq(teamMatches.status, "open"))
      .orderBy(desc(teamMatches.createdAt));
  }

  async updateTeamMatch(id: number, data: Partial<InsertTeamMatch>): Promise<TeamMatch | undefined> {
    const [updatedMatch] = await db.update(teamMatches)
      .set(data)
      .where(eq(teamMatches.id, id))
      .returning();
    
    return updatedMatch;
  }

  async updateTeamMatchResult(id: number, result: string): Promise<TeamMatch | undefined> {
    const [updatedMatch] = await db.update(teamMatches)
      .set({ result })
      .where(eq(teamMatches.id, id))
      .returning();
    
    return updatedMatch;
  }

  async updateTeamMatchStatus(id: number, status: string): Promise<TeamMatch | undefined> {
    const [updatedMatch] = await db.update(teamMatches)
      .set({ status })
      .where(eq(teamMatches.id, id))
      .returning();
    
    return updatedMatch;
  }

  async getTeamMatchesByCategory(category: string): Promise<TeamMatch[]> {
    return await db.select()
      .from(teamMatches)
      .where(eq(teamMatches.category, category))
      .orderBy(desc(teamMatches.createdAt));
  }

  async getTeamMatchGamesByMatchId(matchId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.matchId, matchId))
      .orderBy(desc(games.createdAt));
  }`
      },
      {
        name: "transactionFunctions",
        code: `
  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [createdTransaction] = await db.insert(transactions)
      .values(transaction)
      .returning();
    return createdTransaction;
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(limit?: number): Promise<Transaction[]> {
    let query = db.select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }`
      },
      {
        name: "systemSettingsFunctions",
        code: `
  // System Settings methods
  async getSystemSetting(settingType: string, settingKey: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.settingType, settingType),
          eq(systemSettings.settingKey, settingKey)
        )
      )
      .limit(1);
    
    return setting;
  }

  async upsertSystemSetting(settingType: string, settingKey: string, settingValue: string): Promise<SystemSetting> {
    // Check if setting exists
    const existing = await this.getSystemSetting(settingType, settingKey);
    
    if (existing) {
      // Update existing setting
      const [updated] = await db.update(systemSettings)
        .set({ 
          settingValue,
          updatedAt: new Date() 
        })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new setting
      const [created] = await db.insert(systemSettings)
        .values({
          settingType,
          settingKey,
          settingValue,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return created;
    }
  }

  async getSystemSettingsByType(settingType: string): Promise<SystemSetting[]> {
    return await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.settingType, settingType))
      .orderBy(systemSettings.settingKey);
  }`
      },
      {
        name: "commissionFunctions",
        code: `
  // Subadmin Commission methods
  async getSubadminCommissions(subadminId: number): Promise<SubadminCommission[]> {
    return await db.select()
      .from(subadminCommissions)
      .where(eq(subadminCommissions.subadminId, subadminId))
      .orderBy(subadminCommissions.gameType);
  }

  async upsertSubadminCommission(subadminId: number, gameType: string, commissionRate: number): Promise<SubadminCommission> {
    // Check if commission already exists
    const [existing] = await db.select()
      .from(subadminCommissions)
      .where(
        and(
          eq(subadminCommissions.subadminId, subadminId),
          eq(subadminCommissions.gameType, gameType)
        )
      );
    
    if (existing) {
      // Update existing commission
      const [updated] = await db.update(subadminCommissions)
        .set({ 
          commissionRate,
          updatedAt: new Date() 
        })
        .where(eq(subadminCommissions.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new commission
      const [created] = await db.insert(subadminCommissions)
        .values({
          subadminId,
          gameType,
          commissionRate,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return created;
    }
  }`
      },
      {
        name: "gameOddsFunctions",
        code: `
  // Game Odds methods
  async getGameOdds(gameType: string): Promise<GameOdd[]> {
    return await db.select()
      .from(gameOdds)
      .where(
        and(
          eq(gameOdds.gameType, gameType),
          eq(gameOdds.setByAdmin, true)
        )
      );
  }

  async getGameOddsBySubadmin(subadminId: number, gameType?: string): Promise<GameOdd[]> {
    let query = db.select()
      .from(gameOdds)
      .where(eq(gameOdds.subadminId, subadminId));
    
    if (gameType) {
      query = query.where(eq(gameOdds.gameType, gameType));
    }
    
    return await query;
  }

  async upsertGameOdd(gameType: string, oddValue: number, setByAdmin: boolean, subadminId?: number): Promise<GameOdd> {
    // Build the conditions
    const conditions = [];
    conditions.push(eq(gameOdds.gameType, gameType));
    
    if (setByAdmin) {
      conditions.push(eq(gameOdds.setByAdmin, true));
    } else if (subadminId) {
      conditions.push(eq(gameOdds.subadminId, subadminId));
    }
    
    // Check if odd already exists
    const [existing] = await db.select()
      .from(gameOdds)
      .where(and(...conditions));
    
    if (existing) {
      // Update existing odd
      const [updated] = await db.update(gameOdds)
        .set({ 
          oddValue,
          updatedAt: new Date()
        })
        .where(eq(gameOdds.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new odd
      const [created] = await db.insert(gameOdds)
        .values({
          gameType,
          oddValue,
          setByAdmin,
          subadminId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return created;
    }
  }

  async getOddsForPlayer(userId: number, gameType: string): Promise<number> {
    // Get the player's assigned subadmin
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user || !user.assignedTo) {
      // If no assigned subadmin, use admin odds
      const [adminOdd] = await db.select()
        .from(gameOdds)
        .where(
          and(
            eq(gameOdds.gameType, gameType),
            eq(gameOdds.setByAdmin, true)
          )
        );
      
      return adminOdd?.oddValue || 200; // Default to 2.00 odds (stored as integer: 200)
    }
    
    // Check if subadmin has custom odds for this game type
    const [subadminOdd] = await db.select()
      .from(gameOdds)
      .where(
        and(
          eq(gameOdds.gameType, gameType),
          eq(gameOdds.subadminId, user.assignedTo)
        )
      );
    
    if (subadminOdd) {
      return subadminOdd.oddValue;
    }
    
    // Fall back to admin odds
    const [adminOdd] = await db.select()
      .from(gameOdds)
      .where(
        and(
          eq(gameOdds.gameType, gameType),
          eq(gameOdds.setByAdmin, true)
        )
      );
    
    return adminOdd?.oddValue || 200; // Default to 2.00 odds
  }`
      },
      {
        name: "seedingMethods",
        code: `
  // Admin seeding methods
  async seedCricketTossGames(): Promise<void> {
    // No real implementation needed
    console.log("Cricket toss games seeding is disabled");
  }

  async seedDemoSatamatkaMarkets(): Promise<void> {
    // No real implementation needed
    console.log("Demo Satamatka markets seeding is disabled");
  }`
      }
    ];
    
    // Find a good insertion point - right after the last implemented function
    const insertionPointRegex = /(async updateGameResult\([^)]*\)[^{]*{[\s\S]*?})/;
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
    
    // Write the updated file
    fs.writeFileSync('./server/storage.ts', updatedFile);
    console.log("Added remaining storage functions to storage.ts");
    
  } catch (error) {
    console.error("Error adding remaining functions:", error);
  }
}

addRestOfFunctions();