// This script creates a minimal but working storage.ts file
import fs from 'fs';

function createMinimalStorage() {
  try {
    console.log("Creating minimal storage.ts file...");
    
    const minimalStorageContent = `import { db } from "./db";
import { 
  users, 
  games, 
  satamatkaMarkets,
  teamMatches,
  systemSettings,
  subadminCommissions,
  userDiscounts,
  playerDepositDiscounts,
  gameOdds,
  transactions,
  walletRequests,
  User, 
  InsertUser, 
  Game, 
  InsertGame, 
  UserRole, 
  SatamatkaMarket,
  InsertSatamatkaMarket,
  TeamMatch,
  InsertTeamMatch,
  SystemSetting,
  MarketStatus,
  RecurrencePattern,
  InsertSystemSetting,
  SubadminCommission,
  InsertSubadminCommission,
  UserDiscount,
  InsertUserDiscount,
  PlayerDepositDiscount,
  InsertPlayerDepositDiscount,
  GameOdd,
  InsertGameOdd,
  Transaction,
  InsertTransaction,
  RequestType,
  RequestStatus,
  InsertWalletRequest,
  WalletRequest,
  PaymentMode,
  GameType
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, desc, and, lt, gt, gte, lte, ne, isNotNull, or, sql, asc, count, isNull, like, not } from 'drizzle-orm';
import { pool } from "./db";

/**
 * Storage interface for database operations
 */
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUsersByAssignedTo(assignedToId: number): Promise<User[]>;
  updateUserBalance(userId: number, newBalance: number): Promise<User | undefined>;
  updateUser(userId: number, data: {username?: string; password?: string}): Promise<User | undefined>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  blockUser(userId: number, blockedById: number): Promise<User | undefined>;
  unblockUser(userId: number): Promise<User | undefined>;
  getBlockedByUser(userId: number): Promise<number | null>;
  assignUserToAdmin(userId: number, adminId: number): Promise<User | undefined>;
  
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getGamesByUserId(userId: number): Promise<Game[]>;
  getGamesByUserIds(userIds: number[]): Promise<Game[]>;
  getAllGames(limit?: number): Promise<Game[]>;
  getRecentGames(userId: number, limit?: number): Promise<Game[]>;
  updateGameStatus(gameId: number, status: string): Promise<Game | undefined>;
  updateGameResult(gameId: number, result: string, payout?: number): Promise<Game | undefined>;

  // Satamatka Market methods
  createSatamatkaMarket(market: InsertSatamatkaMarket): Promise<SatamatkaMarket>;
  getSatamatkaMarket(id: number): Promise<SatamatkaMarket | undefined>;
  getAllSatamatkaMarkets(): Promise<SatamatkaMarket[]>;
  getActiveSatamatkaMarkets(): Promise<SatamatkaMarket[]>;
  updateSatamatkaMarketResults(id: number, openResult?: string, closeResult?: string): Promise<SatamatkaMarket | undefined>;
  updateSatamatkaMarketStatus(id: number, status: string): Promise<SatamatkaMarket | undefined>;
  getSatamatkaGamesByMarketId(marketId: number): Promise<Game[]>;

  // Team Match methods
  createTeamMatch(match: InsertTeamMatch): Promise<TeamMatch>;
  getTeamMatch(id: number): Promise<TeamMatch | undefined>;
  getAllTeamMatches(): Promise<TeamMatch[]>;
  getActiveTeamMatches(): Promise<TeamMatch[]>;
  updateTeamMatch(id: number, data: Partial<InsertTeamMatch>): Promise<TeamMatch | undefined>;
  updateTeamMatchResult(id: number, result: string): Promise<TeamMatch | undefined>;
  updateTeamMatchStatus(id: number, status: string): Promise<TeamMatch | undefined>;
  getTeamMatchesByCategory(category: string): Promise<TeamMatch[]>; 
  getTeamMatchGamesByMatchId(matchId: number): Promise<Game[]>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  getAllTransactions(limit?: number): Promise<Transaction[]>;

  // System Settings methods
  getSystemSetting(settingType: string, settingKey: string): Promise<SystemSetting | undefined>;
  upsertSystemSetting(settingType: string, settingKey: string, settingValue: string): Promise<SystemSetting>;
  getSystemSettingsByType(settingType: string): Promise<SystemSetting[]>;
  
  // Subadmin Commission methods
  getSubadminCommissions(subadminId: number): Promise<SubadminCommission[]>;
  upsertSubadminCommission(subadminId: number, gameType: string, commissionRate: number): Promise<SubadminCommission>;
  
  // User Discount methods
  getUserDiscounts(userId: number, subadminId: number): Promise<UserDiscount[]>;
  upsertUserDiscount(subadminId: number, userId: number, gameType: string, discountRate: number): Promise<UserDiscount>;
  
  // Player deposit discount methods
  getPlayerDepositDiscount(userId: number, subadminId: number): Promise<PlayerDepositDiscount | undefined>;
  upsertPlayerDepositDiscount(subadminId: number, userId: number, discountRate: number): Promise<PlayerDepositDiscount>;
  
  // Game Odds methods
  getGameOdds(gameType: string): Promise<GameOdd[]>;
  getGameOddsBySubadmin(subadminId: number, gameType?: string): Promise<GameOdd[]>;
  upsertGameOdd(gameType: string, oddValue: number, setByAdmin: boolean, subadminId?: number): Promise<GameOdd>;
  getOddsForPlayer(userId: number, gameType: string): Promise<number>;

  // Admin seeding methods
  seedCricketTossGames(): Promise<void>;
  seedDemoSatamatkaMarkets(): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

/**
 * Database storage implementation for Postgres
 */
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    const PgStore = connectPg(session);
    this.sessionStore = new PgStore({
      pool,
      tableName: 'sessions'
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByAssignedTo(assignedToId: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.assignedTo, assignedToId));
  }

  async updateUserBalance(userId: number, newBalance: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUser(userId: number, data: {username?: string; password?: string}): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async blockUser(userId: number, blockedById: number): Promise<User | undefined> {
    const [blockedUser] = await db.update(users)
      .set({ 
        isBlocked: true, 
        blockedBy: blockedById 
      })
      .where(eq(users.id, userId))
      .returning();
    return blockedUser;
  }

  async unblockUser(userId: number): Promise<User | undefined> {
    const [unblockedUser] = await db.update(users)
      .set({ 
        isBlocked: false, 
        blockedBy: null 
      })
      .where(eq(users.id, userId))
      .returning();
    return unblockedUser;
  }

  async getBlockedByUser(userId: number): Promise<number | null> {
    const [user] = await db.select({ blockedBy: users.blockedBy })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user?.blockedBy || null;
  }

  async assignUserToAdmin(userId: number, adminId: number): Promise<User | undefined> {
    const [assignedUser] = await db.update(users)
      .set({ assignedTo: adminId })
      .where(eq(users.id, userId))
      .returning();
    return assignedUser;
  }

  // Game methods
  async createGame(game: InsertGame): Promise<Game> {
    const [createdGame] = await db.insert(games)
      .values(game)
      .returning();
    return createdGame;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1);
    return game;
  }

  async getGamesByUserId(userId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));
  }

  async getGamesByUserIds(userIds: number[]): Promise<Game[]> {
    if (!userIds.length) return [];
    
    return await db.select()
      .from(games)
      .where(sql\`\${games.userId} IN (\${userIds.join(', ')})\`)
      .orderBy(desc(games.createdAt));
  }

  async getAllGames(limit?: number): Promise<Game[]> {
    let query = db.select()
      .from(games)
      .orderBy(desc(games.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async getRecentGames(userId: number, limit?: number): Promise<Game[]> {
    let query = db.select()
      .from(games)
      .where(eq(games.userId, userId))
      .orderBy(desc(games.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    return await query;
  }

  async updateGameStatus(gameId: number, status: string): Promise<Game | undefined> {
    const [game] = await db.update(games)
      .set({ status })
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }

  async updateGameResult(gameId: number, result: string, payout?: number): Promise<Game | undefined> {
    let updateData: any = { result };
    if (payout !== undefined) {
      updateData.payout = payout;
    }
    
    const [game] = await db.update(games)
      .set(updateData)
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }

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
    let updateData: any = {};
    
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
  }

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
  }

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
  }

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
  }

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
  }

  // User Discount methods
  async getUserDiscounts(userId: number, subadminId: number): Promise<UserDiscount[]> {
    return await db.select()
      .from(userDiscounts)
      .where(
        and(
          eq(userDiscounts.userId, userId),
          eq(userDiscounts.subadminId, subadminId)
        )
      )
      .orderBy(userDiscounts.gameType);
  }

  async upsertUserDiscount(subadminId: number, userId: number, gameType: string, discountRate: number): Promise<UserDiscount> {
    // Check if discount already exists
    const [existing] = await db.select()
      .from(userDiscounts)
      .where(
        and(
          eq(userDiscounts.subadminId, subadminId),
          eq(userDiscounts.userId, userId),
          eq(userDiscounts.gameType, gameType)
        )
      );
    
    if (existing) {
      // Update existing discount
      const [updated] = await db.update(userDiscounts)
        .set({ 
          discountRate,
          updatedAt: new Date()
        })
        .where(eq(userDiscounts.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new discount
      const [created] = await db.insert(userDiscounts)
        .values({
          subadminId,
          userId,
          gameType,
          discountRate,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return created;
    }
  }

  // Player Deposit Discount methods
  async getPlayerDepositDiscount(userId: number, subadminId: number): Promise<PlayerDepositDiscount | undefined> {
    const [discount] = await db.select()
      .from(playerDepositDiscounts)
      .where(
        and(
          eq(playerDepositDiscounts.userId, userId),
          eq(playerDepositDiscounts.subadminId, subadminId)
        )
      );
    
    return discount;
  }

  async upsertPlayerDepositDiscount(subadminId: number, userId: number, discountRate: number): Promise<PlayerDepositDiscount> {
    // Check if discount already exists
    const [existing] = await db.select()
      .from(playerDepositDiscounts)
      .where(
        and(
          eq(playerDepositDiscounts.subadminId, subadminId),
          eq(playerDepositDiscounts.userId, userId)
        )
      );
    
    if (existing) {
      // Update existing discount
      const [updated] = await db.update(playerDepositDiscounts)
        .set({ 
          discountRate,
          updatedAt: new Date()
        })
        .where(eq(playerDepositDiscounts.id, existing.id))
        .returning();
      
      return updated;
    } else {
      // Create new discount
      const [created] = await db.insert(playerDepositDiscounts)
        .values({
          subadminId,
          userId,
          discountRate,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return created;
    }
  }

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
    let conditions = [eq(gameOdds.gameType, gameType)];
    
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
  }

  // Admin seeding methods
  async seedCricketTossGames(): Promise<void> {
    console.log("Cricket toss games seeding is disabled");
  }

  async seedDemoSatamatkaMarkets(): Promise<void> {
    console.log("Demo Satamatka markets seeding is disabled");
  }
}

export const storage = new DatabaseStorage();`;
    
    // Write the minimal storage file
    fs.writeFileSync('./server/storage.ts', minimalStorageContent);
    console.log("Created minimal storage.ts file");
    
  } catch (error) {
    console.error("Error creating minimal storage:", error);
  }
}

createMinimalStorage();