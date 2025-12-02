import { db } from "./db";
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
  depositCommissions,
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
import { eq, desc, and, lt, gt, gte, lte, ne, isNotNull, or, sql, asc, count, isNull, like, not, inArray } from 'drizzle-orm';
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
  getUsersByIds(userIds: number[]): Promise<User[]>;
  updateUserBalance(userId: number, newBalance: number): Promise<User | undefined>;
  updateUser(userId: number, data: {username?: string; password?: string}): Promise<User | undefined>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<User | undefined>;
  blockUser(userId: number, blockedById: number): Promise<User | undefined>;
  unblockUser(userId: number): Promise<User | undefined>;
  getBlockedByUser(userId: number): Promise<number | null>;
  assignUserToAdmin(userId: number, adminId: number): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  getGamesByUserId(userId: number): Promise<Game[]>;
  getGamesByUserIds(userIds: number[]): Promise<Game[]>;
  getAllGames(limit?: number): Promise<Game[]>;
  getActiveGames(): Promise<Game[]>;
  getActiveBetsByUserId(userId: number): Promise<Game[]>;
  getRecentGames(userId: number, limit?: number): Promise<Game[]>;
  updateGameStatus(gameId: number, status: string): Promise<Game | undefined>;
  updateGameResult(gameId: number, result: string, payout?: number): Promise<Game | undefined>;
  
  // Admin bet management methods
  cancelBet(gameId: number, adminId: number, cancelRemark: string): Promise<Game | undefined>;
  updateBetPrediction(gameId: number, adminId: number, newPrediction: string): Promise<Game | undefined>;
  updateBetTime(gameId: number, adminId: number, newTime: Date): Promise<Game | undefined>;

  // Satamatka Market methods
  createSatamatkaMarket(market: InsertSatamatkaMarket): Promise<SatamatkaMarket>;
  getSatamatkaMarket(id: number): Promise<SatamatkaMarket | undefined>;
  getAllSatamatkaMarkets(): Promise<SatamatkaMarket[]>;
  getActiveSatamatkaMarkets(): Promise<SatamatkaMarket[]>;
  getMarketsForJantri(): Promise<SatamatkaMarket[]>; // Returns markets pending results (WAITING, OPEN, CLOSED)
  updateSatamatkaMarket(id: number, data: Partial<InsertSatamatkaMarket>): Promise<SatamatkaMarket | undefined>;
  updateSatamatkaMarketResults(id: number, openResult?: string, closeResult?: string): Promise<SatamatkaMarket | undefined>;
  updateSatamatkaMarketStatus(id: number, status: string): Promise<SatamatkaMarket | undefined>;
  getSatamatkaGamesByMarketId(marketId: number): Promise<Game[]>;
  getRecentMarketResults(limit?: number): Promise<SatamatkaMarket[]>;
  getMarketResultsByDateRange(startDate: Date, endDate: Date): Promise<SatamatkaMarket[]>;

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
  getAllTransactionsByType(type: string): Promise<Transaction[]>;
  getRecentTransactions(limit?: number): Promise<any[]>;
  getWalletTransactionsByUserIds(userIds: number[]): Promise<Transaction[]>;

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
  getGameOdds(gameType: string, includeSubadminOdds?: boolean): Promise<GameOdd[]>;
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
  
  async getUserById(userId: number): Promise<User | null> {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  async getUsersByIds(userIds: number[]): Promise<User[]> {
    if (!userIds.length) return [];
    
    // Just query once with all IDs since we can't use the instance method
    const allUsers = await db.select()
      .from(users);
    
    // Filter for the users we need
    return allUsers.filter(user => userIds.includes(user.id));
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
  
  async deleteUser(userId: number): Promise<boolean> {
    try {
      // Execute each deletion separately to avoid multiple command issues
      
      // Delete from deposit_commissions first
      await db.execute(sql`DELETE FROM deposit_commissions WHERE subadmin_id = ${userId}`);
      
      // Delete from game_odds  
      await db.execute(sql`DELETE FROM game_odds WHERE subadmin_id = ${userId}`);
      
      // Delete transactions
      await db.execute(sql`DELETE FROM transactions WHERE user_id = ${userId}`);
      
      // Delete games
      await db.execute(sql`DELETE FROM games WHERE user_id = ${userId}`);
      
      // Update assigned users
      await db.execute(sql`UPDATE users SET assigned_to = NULL WHERE assigned_to = ${userId}`);
      
      // Finally delete the user
      await db.execute(sql`DELETE FROM users WHERE id = ${userId}`);
      
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
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
      .where(inArray(games.userId, userIds))
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

  async getActiveGames(): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(
        or(
          isNull(games.result),
          eq(games.result, 'pending')
        )
      ) // Games without a result or with result='pending' are considered active
      .orderBy(desc(games.createdAt));
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

  // Get active bets for a specific user (pending bets that haven't been settled or cancelled)
  async getActiveBetsByUserId(userId: number): Promise<Game[]> {
    return await db.select()
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.status, 'pending'),
          or(
            isNull(games.result),
            eq(games.result, 'pending')
          )
        )
      )
      .orderBy(desc(games.createdAt));
  }

  // Admin bet management methods
  async cancelBet(gameId: number, adminId: number, cancelRemark: string): Promise<Game | undefined> {
    // First get the existing game to refund the user
    const existingGame = await this.getGame(gameId);
    if (!existingGame) return undefined;
    
    // Only allow cancelling pending bets
    if (existingGame.status !== 'pending') {
      return undefined;
    }
    
    // Refund the bet amount to the user
    const user = await this.getUser(existingGame.userId);
    if (user) {
      await this.updateUserBalance(user.id, user.balance + existingGame.betAmount);
    }
    
    // Update the game status to cancelled with remark
    const [game] = await db.update(games)
      .set({
        status: 'cancelled',
        cancelRemark: cancelRemark,
        modifiedByAdminId: adminId,
        modifiedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }

  async updateBetPrediction(gameId: number, adminId: number, newPrediction: string): Promise<Game | undefined> {
    // First get the existing game
    const existingGame = await this.getGame(gameId);
    if (!existingGame) return undefined;
    
    // Only allow updating pending bets
    if (existingGame.status !== 'pending') {
      return undefined;
    }
    
    // Store original prediction if not already stored
    const originalPrediction = existingGame.originalPrediction || existingGame.prediction;
    
    const [game] = await db.update(games)
      .set({
        prediction: newPrediction,
        originalPrediction: originalPrediction,
        modifiedByAdminId: adminId,
        modifiedAt: new Date()
      })
      .where(eq(games.id, gameId))
      .returning();
    return game;
  }

  async updateBetTime(gameId: number, adminId: number, newTime: Date): Promise<Game | undefined> {
    // First get the existing game
    const existingGame = await this.getGame(gameId);
    if (!existingGame) return undefined;
    
    // Only allow updating pending bets
    if (existingGame.status !== 'pending') {
      return undefined;
    }
    
    // Store original time if not already stored
    const originalCreatedAt = existingGame.originalCreatedAt || existingGame.createdAt;
    
    const [game] = await db.update(games)
      .set({
        createdAt: newTime,
        originalCreatedAt: originalCreatedAt,
        modifiedByAdminId: adminId,
        modifiedAt: new Date()
      })
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
  
  async getSatamatkaMarketsByIds(marketIds: number[]): Promise<SatamatkaMarket[]> {
    if (!marketIds.length) return [];
    
    // Query all markets and filter for the ones we need
    const allMarkets = await db.select()
      .from(satamatkaMarkets);
    
    // Filter for the markets we need
    return allMarkets.filter(market => marketIds.includes(market.id));
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

  async getMarketsForJantri(): Promise<SatamatkaMarket[]> {
    return await db.select()
      .from(satamatkaMarkets)
      .where(
        or(
          eq(satamatkaMarkets.status, MarketStatus.OPEN),
          eq(satamatkaMarkets.status, MarketStatus.WAITING),
          eq(satamatkaMarkets.status, MarketStatus.CLOSED)
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
  
  async updateSatamatkaMarket(id: number, data: Partial<InsertSatamatkaMarket>): Promise<SatamatkaMarket | undefined> {
    const [updatedMarket] = await db.update(satamatkaMarkets)
      .set(data)
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
  
  async getWalletTransactionsByUserIds(userIds: number[]): Promise<Transaction[]> {
    if (!userIds.length) return [];
    
    return await db.select()
      .from(transactions)
      .where(inArray(transactions.userId, userIds))
      .orderBy(desc(transactions.createdAt));
  }

  async getAllTransactionsByType(type: string): Promise<Transaction[]> {
    const queryType = type === "deposit" ? ">" : "<";
    
    return await db.select()
      .from(transactions)
      .where(
        type === "deposit" 
          ? gt(transactions.amount, 0) 
          : lt(transactions.amount, 0)
      )
      .orderBy(desc(transactions.createdAt));
  }
  
  async getRecentTransactions(limit: number = 10): Promise<any[]> {
    // Get transactions with user information
    const result = await db.select({
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      description: transactions.description,
      createdAt: transactions.createdAt,
      username: users.username
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
    
    // Transform results to include transaction type based on amount
    return result.map(tx => ({
      ...tx,
      type: tx.amount > 0 ? 'deposit' : 'withdrawal'
    }));
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
  async getGameOdds(gameType: string, includeSubadminOdds: boolean = true): Promise<GameOdd[]> {
    // If we want all odds (admin + subadmin), just filter by game type
    if (includeSubadminOdds) {
      return await db.select()
        .from(gameOdds)
        .where(eq(gameOdds.gameType, gameType));
    } 
    // Otherwise just get admin odds (legacy behavior)
    else {
      return await db.select()
        .from(gameOdds)
        .where(
          and(
            eq(gameOdds.gameType, gameType),
            eq(gameOdds.setByAdmin, true)
          )
        );
    }
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
  
  // Get game odd by type and subadmin - used for risk management
  async getGameOddBySubadminAndType(subadminId: number, gameType: string): Promise<GameOdd | undefined> {
    try {
      const odds = await db.select()
        .from(gameOdds)
        .where(and(
          eq(gameOdds.subadminId, subadminId),
          eq(gameOdds.gameType, gameType)
        ));
      return odds.length > 0 ? odds[0] : undefined;
    } catch (error) {
      console.error(`Error getting game odd for subadmin ${subadminId} and type ${gameType}:`, error);
      return undefined;
    }
  }
  
  // Get game odd by type - used for risk management
  async getGameOddByType(gameType: string): Promise<GameOdd | undefined> {
    try {
      const odds = await db.select()
        .from(gameOdds)
        .where(and(
          eq(gameOdds.gameType, gameType),
          eq(gameOdds.setByAdmin, true)
        ));
      return odds.length > 0 ? odds[0] : undefined;
    } catch (error) {
      console.error(`Error getting game odd for type ${gameType}:`, error);
      return undefined;
    }
  }
  
  // Get games by type - used for risk management
  async getGamesByType(gameType: string): Promise<Game[]> {
    try {
      return await db.select()
        .from(games)
        .where(eq(games.gameType, gameType));
    } catch (error) {
      console.error(`Error getting games by type ${gameType}:`, error);
      return [];
    }
  }

  async upsertGameOdd(gameType: string, oddValue: number, setByAdmin: boolean, subadminId?: number): Promise<GameOdd> {
    // Build the conditions - we need to be very specific here to make sure we don't override
    // admin odds with subadmin odds or vice versa
    let conditions = [eq(gameOdds.gameType, gameType)];
    
    if (setByAdmin) {
      // For admin odds, make sure we're only updating admin odds (setByAdmin = true)
      conditions.push(eq(gameOdds.setByAdmin, true));
      // Admin odds should not have a subadminId
      conditions.push(isNull(gameOdds.subadminId));
    } else if (subadminId) {
      // For subadmin odds, make sure we're only updating specific subadmin odds
      conditions.push(eq(gameOdds.setByAdmin, false));
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

  async getRecentMarketResults(limit: number = 20): Promise<SatamatkaMarket[]> {
    return await db.select()
      .from(satamatkaMarkets)
      .where(eq(satamatkaMarkets.status, 'resulted'))
      .orderBy(desc(satamatkaMarkets.createdAt))
      .limit(limit);
  }

  async getMarketResultsByDateRange(startDate: Date, endDate: Date): Promise<SatamatkaMarket[]> {
    return await db.select()
      .from(satamatkaMarkets)
      .where(
        and(
          eq(satamatkaMarkets.status, 'resulted'),
          gte(satamatkaMarkets.createdAt, startDate),
          lte(satamatkaMarkets.createdAt, endDate)
        )
      )
      .orderBy(desc(satamatkaMarkets.createdAt));
  }
}

export const storage = new DatabaseStorage();