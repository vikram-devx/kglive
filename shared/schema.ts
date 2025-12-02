import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, json, jsonb, decimal, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User roles
export const UserRole = {
  ADMIN: "admin",
  SUBADMIN: "subadmin",
  PLAYER: "player",
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Game outcomes
export const GameOutcome = {
  HEADS: "heads",
  TAILS: "tails",
} as const;

export type GameOutcomeType = typeof GameOutcome[keyof typeof GameOutcome];

// Game types
export const GameType = {
  COIN_FLIP: "coin_flip",
  SATAMATKA: "satamatka",
  CRICKET_TOSS: "cricket_toss"
} as const;

export type GameTypeValue = typeof GameType[keyof typeof GameType];

// Note: Team Match functionality has been removed from the application
// These constants are kept for compatibility with existing code
export const TeamMatchResult = {
  TEAM_A: "team_a",
  TEAM_B: "team_b",
  DRAW: "draw",
  PENDING: "pending",
} as const;

export type TeamMatchResultValue = typeof TeamMatchResult[keyof typeof TeamMatchResult];

// Match categories
export const MatchCategory = {
  CRICKET: "cricket",
  FOOTBALL: "football",
  BASKETBALL: "basketball",
  OTHER: "other",
} as const;

export type MatchCategoryValue = typeof MatchCategory[keyof typeof MatchCategory];

// Market types
export const MarketType = {
  DISHAWAR: "dishawar",
  GALI: "gali",
  MUMBAI: "mumbai",
  KALYAN: "kalyan",
} as const;

export type MarketTypeValue = typeof MarketType[keyof typeof MarketType];

// Satamatka Game Modes for Dishawar/Gali markets
export const SatamatkaGameMode = {
  JODI: "jodi", // Bet on two-digit number (00-99)
  HARF: "harf", // Bet on a single digit in a specific position (left or right)
  CROSSING: "crossing", // Cross betting
  ODD_EVEN: "odd_even", // Bet on whether the result will be odd or even
} as const;

export type SatamatkaGameModeValue = typeof SatamatkaGameMode[keyof typeof SatamatkaGameMode];

// Bet status for games
export const BetStatus = {
  PENDING: "pending",     // Bet is active, waiting for result
  SETTLED: "settled",     // Bet has been settled (win/loss)
  CANCELLED: "cancelled", // Bet was cancelled by admin
} as const;

export type BetStatusValue = typeof BetStatus[keyof typeof BetStatus];

// Payment Method Enums
export const PaymentMode = {
  UPI: 'upi',
  BANK: 'bank',
} as const;

export type PaymentModeType = typeof PaymentMode[keyof typeof PaymentMode];

export const RequestStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus];

export const RequestType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
} as const;

export type RequestTypeValue = typeof RequestType[keyof typeof RequestType];

// Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  mobile: text("mobile"),
  role: text("role").notNull().default(UserRole.PLAYER), // admin, subadmin, player
  balance: integer("balance").notNull().default(0),
  assignedTo: integer("assigned_to").references(() => users.id),
  isBlocked: boolean("is_blocked").notNull().default(false),
  blockedBy: integer("blocked_by").references(() => users.id),
  rewardCommission: integer("reward_commission").notNull().default(0), // percentage (stored as integer, e.g. 500 = 5.00%)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    mobile: true,
    role: true,
    assignedTo: true,
    rewardCommission: true,
  })
  .extend({
    role: z.enum([UserRole.ADMIN, UserRole.SUBADMIN, UserRole.PLAYER]),
  })
  .partial({
    assignedTo: true,
    email: true,
    mobile: true,
    rewardCommission: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gameType: text("game_type").notNull().default(GameType.COIN_FLIP), // coin_flip, satamatka, team_match
  betAmount: integer("bet_amount").notNull(),
  prediction: text("prediction").notNull(), // For coin flip: "heads" or "tails", for satamatka: "0" to "9" or "00" to "99"
  result: text("result"), // For coin flip: "heads" or "tails", for satamatka: "0" to "9" or "00" to "99"
  payout: integer("payout").notNull().default(0),
  balanceAfter: integer("balance_after"), // Balance after this game is played (for history tracking)
  createdAt: timestamp("created_at").defaultNow(),
  marketId: integer("market_id").references(() => satamatkaMarkets.id),
  matchId: integer("match_id").references(() => teamMatches.id),
  gameMode: text("game_mode"), // For satamatka: "single", "jodi", "patti"
  gameData: jsonb("game_data"), // For cricket_toss: team names, odds, etc.
  // Bet management fields
  status: text("status").notNull().default(BetStatus.PENDING), // pending, settled, cancelled
  cancelRemark: text("cancel_remark"), // Reason for cancellation (visible to user)
  // Admin-only tracking fields (not exposed to users/subadmins)
  originalPrediction: text("original_prediction"), // Original bet number before admin changed it
  originalCreatedAt: timestamp("original_created_at"), // Original bet time before admin changed it
  modifiedByAdminId: integer("modified_by_admin_id").references(() => users.id), // Admin who made changes
  modifiedAt: timestamp("modified_at"), // When admin made changes
});

export const insertGameSchema = createInsertSchema(games)
  .pick({
    userId: true,
    gameType: true,
    betAmount: true,
    prediction: true,
    result: true,
    payout: true,
    balanceAfter: true,
    marketId: true,
    matchId: true,
    gameMode: true,
    gameData: true,
  })
  .extend({
    gameType: z.enum([GameType.COIN_FLIP, GameType.SATAMATKA, GameType.CRICKET_TOSS]),
    gameMode: z.enum([
      SatamatkaGameMode.JODI,
      SatamatkaGameMode.HARF,
      SatamatkaGameMode.CROSSING, 
      SatamatkaGameMode.ODD_EVEN
    ]).optional(),
    gameData: z.any().optional(), 
  })
  .partial({
    result: true,
    balanceAfter: true,
    marketId: true,
    matchId: true,
    gameMode: true,
    gameData: true,
  });

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export const RecurrencePattern = {
  DAILY: "daily",
  WEEKDAYS: "weekdays",
  WEEKLY: "weekly",
  CUSTOM: "custom",
} as const;

export type RecurrencePatternValue = typeof RecurrencePattern[keyof typeof RecurrencePattern];

export const MarketStatus = {
  WAITING: "waiting",  // Newly created, not yet open for betting
  OPEN: "open",        // Open for betting
  CLOSED: "closed",    // Closed for betting, awaiting results
  RESULTED: "resulted", // Results published
  SETTLED: "settled",  // Bets have been settled
} as const;

export type MarketStatusValue = typeof MarketStatus[keyof typeof MarketStatus];

export const satamatkaMarkets = pgTable("satamatka_markets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // dishawar, gali, mumbai, kalyan
  openTime: timestamp("open_time").notNull(),
  closeTime: timestamp("close_time").notNull(),
  resultTime: timestamp("result_time"), // Added new field for result declaration time
  openResult: text("open_result"),
  closeResult: text("close_result"),
  status: text("status").notNull().default(MarketStatus.WAITING),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrencePattern: text("recurrence_pattern").default(RecurrencePattern.DAILY),
  lastResultedDate: timestamp("last_resulted_date"),
  nextOpenTime: timestamp("next_open_time"), 
  nextCloseTime: timestamp("next_close_time"),
  coverImage: text("cover_image"), // Added field for market cover image
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSatamatkaMarketSchema = createInsertSchema(satamatkaMarkets)
  .pick({
    name: true,
    type: true,
    openResult: true,
    closeResult: true,
    status: true,
    isRecurring: true,
    recurrencePattern: true,
    nextOpenTime: true,
    nextCloseTime: true,
    resultTime: true,
  })
  .extend({
    type: z.enum([MarketType.DISHAWAR, MarketType.GALI, MarketType.MUMBAI, MarketType.KALYAN]),
    coverImage: z.string().optional(),
    openTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
    closeTime: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
    resultTime: z.union([z.string(), z.date()]).transform(val => 
      val ? (typeof val === 'string' ? new Date(val) : val) : undefined
    ).optional(),
    status: z.enum([
      MarketStatus.WAITING,
      MarketStatus.OPEN, 
      MarketStatus.CLOSED, 
      MarketStatus.RESULTED, 
      MarketStatus.SETTLED
    ]).default(MarketStatus.WAITING),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.enum([
      RecurrencePattern.DAILY,
      RecurrencePattern.WEEKDAYS,
      RecurrencePattern.WEEKLY,
      RecurrencePattern.CUSTOM
    ]).default(RecurrencePattern.DAILY).optional(),
    nextOpenTime: z.union([z.string(), z.date()]).transform(val => 
      val ? (typeof val === 'string' ? new Date(val) : val) : undefined
    ).optional(),
    nextCloseTime: z.union([z.string(), z.date()]).transform(val => 
      val ? (typeof val === 'string' ? new Date(val) : val) : undefined
    ).optional(),
  })
  .partial({
    openResult: true,
    closeResult: true,
    recurrencePattern: true,
    nextOpenTime: true,
    nextCloseTime: true,
    resultTime: true,
  });

export type InsertSatamatkaMarket = z.infer<typeof insertSatamatkaMarketSchema>;
export type SatamatkaMarket = typeof satamatkaMarkets.$inferSelect;

// Wallet Request Schema
export const walletRequests = pgTable("wallet_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // in cents
  requestType: text("request_type").notNull(), // 'deposit' or 'withdrawal'
  paymentMode: text("payment_mode").notNull(), // 'upi', 'bank'
  paymentDetails: json("payment_details").notNull(),
  status: text("status").notNull().default(RequestStatus.PENDING), // 'pending', 'approved', 'rejected'
  proofImageUrl: text("proof_image_url"),
  notes: text("notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id), // ID of admin/subadmin who reviewed this request
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transaction Schema
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(), // positive for deposit, negative for withdrawal
  balanceAfter: integer("balance_after"), // Balance after transaction (added to track history)
  performedBy: integer("performed_by")
    .notNull()
    .references(() => users.id), // ID of admin/subadmin who performed this action
  description: text("description"), // Remark or description for the transaction
  requestId: integer("request_id").references(() => walletRequests.id), // Reference to the wallet request if applicable
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertTransactionSchema = createInsertSchema(transactions)
  .pick({
    userId: true,
    amount: true,
    balanceAfter: true,
    performedBy: true,
    description: true,
    requestId: true,
  })
  .partial({
    description: true,
    requestId: true,
    balanceAfter: true,
  });

export const insertWalletRequestSchema = createInsertSchema(walletRequests)
  .pick({
    userId: true,
    amount: true,
    requestType: true,
    paymentMode: true,
    paymentDetails: true,
    proofImageUrl: true,
    notes: true,
  })
  .extend({
    requestType: z.enum([RequestType.DEPOSIT, RequestType.WITHDRAWAL]),
    paymentMode: z.enum([PaymentMode.UPI, PaymentMode.BANK]),
  })
  .partial({
    proofImageUrl: true,
    notes: true,
  });

export type InsertWalletRequest = z.infer<typeof insertWalletRequestSchema>;
export type WalletRequest = typeof walletRequests.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Team Matches Schema (kept for compatibility)
export const teamMatches = pgTable("team_matches", {
  id: serial("id").primaryKey(),
  teamA: text("team_a").notNull(),
  teamB: text("team_b").notNull(),
  category: text("category").notNull().default(MatchCategory.CRICKET),
  description: text("description"),
  matchTime: timestamp("match_time").notNull(),
  result: text("result").notNull().default(TeamMatchResult.PENDING),
  oddTeamA: integer("odd_team_a").notNull().default(200),
  oddTeamB: integer("odd_team_b").notNull().default(200),
  oddDraw: integer("odd_draw").default(300),
  status: text("status").notNull().default("open"),
  teamAImage: text("team_a_image"),
  teamBImage: text("team_b_image"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMatchSchema = createInsertSchema(teamMatches)
  .pick({
    teamA: true,
    teamB: true,
    category: true,
    description: true,
    matchTime: true,
    result: true,
    oddTeamA: true,
    oddTeamB: true,
    oddDraw: true,
    status: true,
    teamAImage: true,
    teamBImage: true,
    coverImage: true,
  })
  .extend({
    matchTime: z.union([
      z.string().transform((val) => new Date(val)),
      z.date()
    ]),
    category: z.enum([
      MatchCategory.CRICKET,
      MatchCategory.FOOTBALL,
      MatchCategory.BASKETBALL,
      MatchCategory.OTHER
    ]).default(MatchCategory.CRICKET),
    result: z.enum([
      TeamMatchResult.TEAM_A,
      TeamMatchResult.TEAM_B,
      TeamMatchResult.DRAW,
      TeamMatchResult.PENDING
    ]).default(TeamMatchResult.PENDING),
    status: z.enum(["open", "closed", "resulted"]).default("open"),
    teamAImage: z.string().optional(),
    teamBImage: z.string().optional(),
    coverImage: z.string().optional(),
  });

export type InsertTeamMatch = z.infer<typeof insertTeamMatchSchema>;
export type TeamMatch = typeof teamMatches.$inferSelect;

// Define relations after all tables are defined
// Session table for connect-pg-simple
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey().notNull(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  // Self-relation for assignedTo
  assignedToUser: one(users, {
    fields: [users.assignedTo],
    references: [users.id],
    relationName: "assignedToUser",
  }),
  // Inverse of assignedTo relation
  assignedUsers: many(users, { relationName: "assignedToUser" }),
  // Relation to games
  games: many(games),
  // Relation to transactions
  transactions: many(transactions, { relationName: "userTransactions" }),
  // Relation to transactions performed by this user
  performedTransactions: many(transactions, { relationName: "performedByTransactions" }),
  // Relation to wallet requests
  walletRequests: many(walletRequests),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
  }),
  market: one(satamatkaMarkets, {
    fields: [games.marketId],
    references: [satamatkaMarkets.id],
    relationName: "marketGames",
  }),
  match: one(teamMatches, {
    fields: [games.matchId],
    references: [teamMatches.id],
    relationName: "teamMatchGames",
  }),
}));

export const satamatkaMarketsRelations = relations(satamatkaMarkets, ({ many }) => ({
  games: many(games, { relationName: "marketGames" }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  // User who this transaction affects
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
    relationName: "userTransactions",
  }),
  // User who performed this transaction
  performer: one(users, {
    fields: [transactions.performedBy],
    references: [users.id],
    relationName: "performedByTransactions",
  }),
  // Relation to wallet request
  request: one(walletRequests, {
    fields: [transactions.requestId],
    references: [walletRequests.id],
  }),
}));

export const walletRequestsRelations = relations(walletRequests, ({ one, many }) => ({
  // User who made this request
  user: one(users, {
    fields: [walletRequests.userId],
    references: [users.id],
  }),
  // Admin/subadmin who reviewed this request
  reviewer: one(users, {
    fields: [walletRequests.reviewedBy],
    references: [users.id],
  }),
  // Transactions related to this request
  transactions: many(transactions),
}));

export const teamMatchesRelations = relations(teamMatches, ({ many }) => ({
  games: many(games, { relationName: "teamMatchGames" }),
}));

// System Settings Schema
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingType: text("setting_type").notNull(), // payment, odds, commission, etc.
  settingKey: text("setting_key").notNull(),
  settingValue: text("setting_value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// SubAdmin Commission Schema
export const subadminCommissions = pgTable("subadmin_commissions", {
  id: serial("id").primaryKey(),
  subadminId: integer("subadmin_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  gameType: text("game_type").notNull(), // satamatka_single, satamatka_jodi, etc.
  commissionRate: integer("commission_rate").notNull(), // percentage (stored as integer, e.g. 525 = 5.25%)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deposit commissions for subadmins (used in fund transfers)
export const depositCommissions = pgTable("deposit_commissions", {
  id: serial("id").primaryKey(),
  subadminId: integer("subadmin_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  commissionRate: integer("commission_rate").notNull(), // percentage (stored as integer, e.g. 3000 = 30.00%)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubadminCommissionSchema = createInsertSchema(subadminCommissions);
export type InsertSubadminCommission = z.infer<typeof insertSubadminCommissionSchema>;
export type SubadminCommission = typeof subadminCommissions.$inferSelect;

export const insertDepositCommissionSchema = createInsertSchema(depositCommissions);
export type InsertDepositCommission = z.infer<typeof insertDepositCommissionSchema>;
export type DepositCommission = typeof depositCommissions.$inferSelect;

// User Discount Schema (set by subadmin)
export const userDiscounts = pgTable("user_discounts", {
  id: serial("id").primaryKey(),
  subadminId: integer("subadmin_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  gameType: text("game_type").notNull(), // satamatka_single, satamatka_jodi, etc.
  discountRate: integer("discount_rate").notNull(), // percentage (stored as integer, e.g. 525 = 5.25%)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table for player deposit discounts (separate from game-specific discounts)
export const playerDepositDiscounts = pgTable("player_deposit_discounts", {
  id: serial("id").primaryKey(),
  subadminId: integer("subadmin_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  discountRate: integer("discount_rate").notNull(), // percentage (stored as integer, e.g. 1000 = 10.00%)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserDiscountSchema = createInsertSchema(userDiscounts);
export type InsertUserDiscount = z.infer<typeof insertUserDiscountSchema>;
export type UserDiscount = typeof userDiscounts.$inferSelect;

export const insertPlayerDepositDiscountSchema = createInsertSchema(playerDepositDiscounts);
export type InsertPlayerDepositDiscount = z.infer<typeof insertPlayerDepositDiscountSchema>;
export type PlayerDepositDiscount = typeof playerDepositDiscounts.$inferSelect;

// Game Odds Schema
export const gameOdds = pgTable("game_odds", {
  id: serial("id").primaryKey(),
  gameType: text("game_type").notNull(), // satamatka_single, satamatka_jodi, etc.
  oddValue: integer("odd_value").notNull(), // multiplier (stored as integer, e.g. 250 = 2.50x)
  setByAdmin: boolean("set_by_admin").default(true).notNull(), // true if set by admin, false if by subadmin
  subadminId: integer("subadmin_id").references(() => users.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameOddSchema = createInsertSchema(gameOdds);
export type InsertGameOdd = z.infer<typeof insertGameOddSchema>;
export type GameOdd = typeof gameOdds.$inferSelect;

// Relations
export const subadminCommissionsRelations = relations(subadminCommissions, ({ one }) => ({
  subadmin: one(users, { fields: [subadminCommissions.subadminId], references: [users.id] }),
}));

export const depositCommissionsRelations = relations(depositCommissions, ({ one }) => ({
  subadmin: one(users, { fields: [depositCommissions.subadminId], references: [users.id] }),
}));

export const userDiscountsRelations = relations(userDiscounts, ({ one }) => ({
  subadmin: one(users, { fields: [userDiscounts.subadminId], references: [users.id] }),
  user: one(users, { fields: [userDiscounts.userId], references: [users.id] }),
}));

export const playerDepositDiscountsRelations = relations(playerDepositDiscounts, ({ one }) => ({
  subadmin: one(users, { fields: [playerDepositDiscounts.subadminId], references: [users.id] }),
  user: one(users, { fields: [playerDepositDiscounts.userId], references: [users.id] }),
}));

export const gameOddsRelations = relations(gameOdds, ({ one }) => ({
  subadmin: one(users, { fields: [gameOdds.subadminId], references: [users.id] }),
}));